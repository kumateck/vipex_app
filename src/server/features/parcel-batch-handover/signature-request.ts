import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps } from '@/db/schemas';
import { Conflict, Forbidden } from '@/server/utils/http-error';
import type { BatchSignaturePreparation } from '@/shared/shipments/batch-signature-request';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';
import { handoverNoteProjection } from '../shipments/handover-note/projection';
import { parcels } from '@/db/schemas';
import { inArray } from 'drizzle-orm';
import { checkBatchQuote } from './eligibility';
import { lockBatchOtp } from './otp';
import { batchSelectionKey, getBatchBranch, getBatchMembers, type BatchActor } from './selection';
import { recordBatchSignatureAudit } from './signature-audit';

export async function validateSignatureSelection(
  actor: BatchActor,
  selection: BatchSignaturePreparation,
  tx: DbExecutor,
) {
  const otp = await lockBatchOtp(actor, selection.id, tx);
  if (
    otp.batchScope !== (await batchSelectionKey(actor, selection)) ||
    otp.verificationToken !== selection.verificationToken
  )
    throw Forbidden('Verify the OTP for this selection before requesting a signature');
  if (
    otp.batchCompletedAt ||
    !otp.verificationTokenExpiresAt ||
    otp.verificationTokenExpiresAt.getTime() <= Date.now()
  )
    throw Conflict('OTP verification expired. Send a new code.');
  return otp;
}

export async function validateSignatureMembers(
  actor: BatchActor,
  selection: Parameters<typeof getBatchMembers>[1],
  tx: DbExecutor,
) {
  const [members, branch] = await Promise.all([
    getBatchMembers(actor, selection, tx),
    getBatchBranch(actor, tx),
  ]);
  // Eligibility reads share the transaction connection and follow the sorted parcel locks.
  for (const member of members) await checkBatchQuote(actor, member, branch.usePickupQueue, tx);
  return members;
}

export async function requestBatchSignature(actor: BatchActor, input: BatchSignaturePreparation) {
  return db.transaction(async (tx) => {
    const otp = await validateSignatureSelection(actor, input, tx);
    const members = await validateSignatureMembers(actor, input, tx);
    if (otp.batchSignatureRequest) return { requestId: otp.batchSignatureRequest.requestId };
    const indicators = await tx
      .select({ id: parcels.id, ...handoverNoteProjection })
      .from(parcels)
      .where(
        inArray(
          parcels.id,
          input.items.map(({ id }) => id),
        ),
      );
    const byId = new Map(indicators.map((row) => [row.id, row]));
    const requestId = createId();
    await tx
      .update(parcelReceiverOtps)
      .set({
        batchSignatureRequest: {
          requestId,
          telephone: otp.phone,
          items: input.items,
          locationId: actor.locationId ?? null,
          requestedAt: new Date().toISOString(),
          parcels: members.map(({ parcel, receiver }) => ({
            id: parcel.id,
            bookingCode: parcel.bookingCode,
            trackingCode: parcel.trackingCode,
            receiverName: receiver.name,
            parcelDetails: parcel.parcelDetails,
            hasHandoverNote: byId.get(parcel.id)?.hasHandoverNote,
            handoverNoteCritical: byId.get(parcel.id)?.handoverNoteCritical,
          })),
        },
      })
      .where(eq(parcelReceiverOtps.id, otp.id));
    await recordBatchSignatureAudit(tx, {
      ...actor,
      id: otp.id,
      requestId,
      parcelIds: input.items.map(({ id }) => id),
      action: 'requested',
    });
    return { requestId };
  });
}

export async function cancelBatchSignature(actor: BatchActor, id: string, requestId: string) {
  return db.transaction(async (tx) => {
    const otp = await lockBatchOtp(actor, id, tx);
    if (otp.batchCompletedAt) throw Conflict('This handover is already completed');
    if (otp.batchSignatureRequest?.requestId !== requestId)
      throw Conflict('The signature request changed. Reload the handover.');
    await tx
      .update(parcelReceiverOtps)
      .set({ batchSignatureRequest: null })
      .where(eq(parcelReceiverOtps.id, id));
    await recordBatchSignatureAudit(tx, {
      ...actor,
      id,
      requestId,
      parcelIds: otp.batchSignatureRequest.items.map(({ id }) => id),
      action: 'cancelled',
    });
    return { cancelled: true };
  });
}
