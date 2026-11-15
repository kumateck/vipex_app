import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps } from '@/db/schemas';
import { PaymentMethod } from '@/db/schemas/enums';
import type {
  BatchConfirmation,
  BatchPaymentMethod,
} from '@/shared/shipments/parcel-batch-handover';
import { isReceiverCashierSignature } from '@/shared/shipments/receiver-cashier-signature';
import { BadRequest, Conflict, Forbidden } from '@/server/utils/http-error';
import { sha256HexAsync } from '@/server/utils/otp';
import { assertActiveSessionSvc } from '../cashiers/service';
import { completeBatchParcel } from './complete-parcel';
import { lockBatchOtp } from './otp';
import { batchSelectionKey, getBatchBranch, getBatchMembers, type BatchActor } from './selection';

const paymentMethods: Record<BatchPaymentMethod, PaymentMethod> = {
  cash: PaymentMethod.CASH,
  telecel: PaymentMethod.TELECEL,
  airtel: PaymentMethod.AIRTEL,
};

export async function confirmBatchHandover(actor: BatchActor, input: BatchConfirmation) {
  if (
    !isReceiverCashierSignature(input.signature) ||
    (actor.workflow === 'office-pickup' && input.signature.source !== 'touchscreen')
  ) {
    throw BadRequest('Capture a valid receiver signature');
  }
  const cashier = actor.workflow === 'receiver-cashier';
  const method = input.paymentMethod ? paymentMethods[input.paymentMethod] : undefined;
  if (cashier && method === undefined) throw BadRequest('Select a payment method');
  if (!cashier && input.paymentMethod) throw BadRequest('Office pickup does not collect payment');
  const [selectionKey, tokenHash] = await Promise.all([
    batchSelectionKey(actor, input),
    sha256HexAsync(input.verificationToken),
  ]);
  return db.transaction(async (tx) => {
    const otp = await lockBatchOtp(actor, input.id, tx);
    const proof = otp.batchCompletedAt ? tokenHash : input.verificationToken;
    if (otp.batchScope !== selectionKey || otp.verificationToken !== proof) {
      throw Forbidden('Verify the OTP for this selection before confirming handover');
    }
    const parcelIds = input.items.map(({ id }) => id);
    if (otp.batchCompletedAt) return { parcelIds, alreadyConfirmed: true };
    if (!otp.verificationTokenExpiresAt || otp.verificationTokenExpiresAt.getTime() <= Date.now())
      throw Conflict('OTP verification expired. Send a new code and sign again.');

    const [members, branch] = await Promise.all([
      getBatchMembers(actor, input, tx),
      getBatchBranch(actor, tx),
      cashier
        ? assertActiveSessionSvc({
            cashierId: actor.actorId,
            branchId: actor.branchId,
            executor: tx,
          })
        : null,
    ]);
    const capturedAt = new Date().toISOString();
    const batch = { id: otp.id, signature: input.signature, capturedAt };

    // Apply the writes in the same order as the parcel locks.
    for (const member of members) {
      await completeBatchParcel(
        actor,
        member,
        { method, associateId: input.associateId, usePickupQueue: branch.usePickupQueue, batch },
        tx,
      );
    }
    await tx
      .update(parcelReceiverOtps)
      .set({
        batchCompletedAt: new Date(),
        verificationToken: tokenHash,
        verificationTokenExpiresAt: null,
      })
      .where(eq(parcelReceiverOtps.id, otp.id));
    return { parcelIds, alreadyConfirmed: false };
  });
}
