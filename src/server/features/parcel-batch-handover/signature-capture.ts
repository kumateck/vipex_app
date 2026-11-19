import { and, desc, eq, gt, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelReceiverOtps } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import type {
  BatchSignaturePage,
  BatchSignatureRow,
  BatchSignatureStatus,
} from '@/shared/shipments/batch-signature-request';
import {
  isReceiverCashierSignature,
  type ReceiverCashierSignature,
} from '@/shared/shipments/receiver-cashier-signature';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import type { BatchActor } from './selection';
import { lockBatchOtp } from './otp';
import { validateSignatureMembers } from './signature-request';
import { recordBatchSignatureAudit } from './signature-audit';

export type SignatureReader = {
  companyId: string;
  branchId: string;
  workflows: BatchHandoverWorkflow[];
};
type Otp = typeof parcelReceiverOtps.$inferSelect;

function pendingScope(scope: SignatureReader) {
  return and(
    eq(parcelReceiverOtps.companyId, scope.companyId),
    eq(parcelReceiverOtps.branchId, scope.branchId),
    isNull(parcelReceiverOtps.batchCompletedAt),
    isNotNull(parcelReceiverOtps.batchSignatureRequest),
    isNotNull(parcelReceiverOtps.verificationToken),
    gt(parcelReceiverOtps.verificationTokenExpiresAt, new Date()),
    sql`split_part(${parcelReceiverOtps.batchScope}, ':', 1) in (${sql.join(
      scope.workflows.map((workflow) => sql`${workflow}`),
      sql`, `,
    )})`,
  );
}

function summary(
  otp: Pick<Otp, 'id' | 'batchSignatureRequest' | 'batchScope' | 'verificationTokenExpiresAt'>,
): BatchSignatureRow {
  const request = otp.batchSignatureRequest!;
  return {
    id: otp.id,
    requestId: request.requestId,
    workflow: otp.batchScope!.startsWith('office-pickup:') ? 'office-pickup' : 'receiver-cashier',
    telephone: request.telephone,
    requestedAt: request.requestedAt,
    expiresAt: otp.verificationTokenExpiresAt!.toISOString(),
    signedAt: request.capture?.capturedAt ?? null,
    parcels: request.parcels,
  };
}

export async function listBatchSignatures(
  scope: SignatureReader,
  query: { search?: string; after?: string },
): Promise<BatchSignaturePage> {
  if (!scope.workflows.length) return { rows: [], next: null };
  const search = query.search?.trim().toLocaleLowerCase();
  const rows = await db
    .select({
      id: parcelReceiverOtps.id,
      batchScope: parcelReceiverOtps.batchScope,
      verificationTokenExpiresAt: parcelReceiverOtps.verificationTokenExpiresAt,
      batchSignatureRequest: sql<
        Otp['batchSignatureRequest']
      >`${parcelReceiverOtps.batchSignatureRequest} #- '{capture,signature}'`,
    })
    .from(parcelReceiverOtps)
    .where(
      and(
        pendingScope(scope),
        query.after ? lt(parcelReceiverOtps.id, query.after) : undefined,
        search
          ? sql`(exists (select 1 from jsonb_array_elements(${parcelReceiverOtps.batchSignatureRequest}->'parcels') member
      where strpos(lower(member->>'bookingCode'), ${search}) > 0
         or strpos(lower(member->>'trackingCode'), ${search}) > 0
         or strpos(lower(member->>'receiverName'), ${search}) > 0)
      or strpos(${parcelReceiverOtps.phone}, ${search}) > 0)`
          : undefined,
      ),
    )
    .orderBy(desc(parcelReceiverOtps.id))
    .limit(21);
  return { rows: rows.slice(0, 20).map(summary), next: rows.length > 20 ? rows[19]!.id : null };
}

export async function getBatchSignatureStatus(
  actor: BatchActor,
  id: string,
): Promise<BatchSignatureStatus | null> {
  return db.transaction(async (tx) => {
    const otp = await lockBatchOtp(actor, id, tx);
    if (
      !otp.batchSignatureRequest ||
      otp.batchCompletedAt ||
      !otp.verificationToken ||
      !otp.verificationTokenExpiresAt ||
      otp.verificationTokenExpiresAt.getTime() <= Date.now()
    )
      return null;
    return { ...summary(otp), signature: otp.batchSignatureRequest.capture?.signature };
  });
}

export async function captureBatchSignature(
  scope: SignatureReader & { actorId: string },
  input: { id: string; requestId: string; signature: ReceiverCashierSignature },
) {
  if (input.signature.source !== 'touchscreen' || !isReceiverCashierSignature(input.signature))
    throw BadRequest('Capture a usable signature');
  if (!scope.workflows.length) throw NotFound('Signature request not found');
  return db.transaction(async (tx) => {
    const [otp] = await tx
      .select()
      .from(parcelReceiverOtps)
      .where(and(pendingScope(scope), eq(parcelReceiverOtps.id, input.id)))
      .for('update');
    if (!otp) throw NotFound('This signature request expired or is no longer available');
    const request = otp.batchSignatureRequest!;
    if (request.requestId !== input.requestId)
      throw Conflict('The parcel selection changed. Reopen the request.');
    const actor: BatchActor = {
      companyId: otp.companyId,
      branchId: otp.branchId,
      actorId: otp.createdBy,
      locationId: request.locationId,
      workflow: summary(otp).workflow,
    };
    await validateSignatureMembers(actor, request, tx);
    if (request.capture) return { signedAt: request.capture.capturedAt };
    const capturedAt = new Date().toISOString();
    await tx
      .update(parcelReceiverOtps)
      .set({
        batchSignatureRequest: {
          ...request,
          capture: { signature: input.signature, capturedAt, capturedBy: scope.actorId },
        },
      })
      .where(eq(parcelReceiverOtps.id, otp.id));
    await recordBatchSignatureAudit(tx, {
      ...scope,
      id: otp.id,
      requestId: request.requestId,
      parcelIds: request.items.map(({ id }) => id),
      action: 'saved',
    });
    return { signedAt: capturedAt };
  });
}
