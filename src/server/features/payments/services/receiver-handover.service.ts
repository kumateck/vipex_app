import { and, desc, eq, lt, isNotNull, or, ilike, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, customers, parcels, ParcelStatus, pickupQueues } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import {
  isReceiverCashierSignature,
  type PendingReceiverHandoverRow,
  type ReceiverCashierSignature,
  type ReceiverHandoverListQuery,
} from '@/shared/shipments/receiver-cashier-signature';
import { assertActiveSessionSvc } from '../../cashiers/service';
import { endPickupQueueForParcelSvc } from '../../pickup-queues/service';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../../shipments/parcel-delivery-reconciliation-guard';
import { assertParcelFullyPaid } from '../../shipments/parcel-payment-settlement';
import { getParcelStorageSettlementSvc } from '../../shipments/parcels.service';
import { listPaymentsForParcelRepo } from '../repository';
import { signalReceiverHandoverChange } from './receiver-handover-changes';
import type { DbExecutor } from '../../shipments/parcel-repositories/parcel-repository.types';

type Scope = { companyId: string; branchId: string };
type Action = Scope & { parcelId: string; handoverId: string; actorId: string };
const PAGE_SIZE = 40;

function parcelScope(input: Scope) {
  return and(
    eq(parcels.companyId, input.companyId),
    eq(parcels.destinationId, input.branchId),
    eq(parcels.isDeleted, false),
  );
}

export async function listReceiverHandovers(
  scope: Scope & ReceiverHandoverListQuery,
): Promise<{ rows: PendingReceiverHandoverRow[]; next: string | null }> {
  const [afterTime, afterId] = scope.after?.split('~') ?? [];
  const activity = sql<string>`coalesce(
    ${parcels.pendingReceiverHandover}->'capture'->>'capturedAt',
    ${parcels.pendingReceiverHandover}->>'requestedAt'
  )`;
  const search = scope.search?.trim().replace(/[\\%_]/g, '\\$&');
  const rows = await db
    .select({
      id: parcels.id,
      handoverId: sql<string>`${parcels.pendingReceiverHandover}->>'id'`,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      receiverId: parcels.receiverId,
      collectorName: sql<string>`${parcels.pendingReceiverHandover}->>'collectorName'`,
      associateName: sql<string>`${parcels.pendingReceiverHandover}->>'associateName'`,
      requestedAt: sql<string>`${parcels.pendingReceiverHandover}->>'requestedAt'`,
      signedAt: sql<string | null>`${parcels.pendingReceiverHandover}->'capture'->>'capturedAt'`,
    })
    .from(parcels)
    .where(
      and(
        parcelScope(scope),
        isNotNull(parcels.pendingReceiverHandover),
        scope.parcelId ? eq(parcels.id, scope.parcelId) : undefined,
        scope.handoverId
          ? sql`${parcels.pendingReceiverHandover}->>'id' = ${scope.handoverId}`
          : undefined,
        afterTime && afterId
          ? or(lt(activity, afterTime), and(eq(activity, afterTime), lt(parcels.id, afterId)))
          : undefined,
        search
          ? or(
              ilike(parcels.trackingCode, `%${search}%`),
              ilike(parcels.bookingCode, `%${search}%`),
              ilike(sql`${parcels.pendingReceiverHandover}->>'collectorName'`, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(activity), desc(parcels.id))
    .limit(PAGE_SIZE + 1);
  const last = rows[PAGE_SIZE - 1];
  return {
    rows: rows.slice(0, PAGE_SIZE),
    next:
      rows.length > PAGE_SIZE && last ? `${last.signedAt ?? last.requestedAt}~${last.id}` : null,
  };
}

export async function getReceiverHandoverPreview(
  scope: Scope & { parcelId: string; handoverId: string },
) {
  const capture = sql`${parcels.pendingReceiverHandover}->'capture'`;
  const [preview] = await db
    .select({
      signatureImage: sql<string>`${capture}->>'signatureImage'`,
      signedAt: sql<string>`${capture}->>'capturedAt'`,
    })
    .from(parcels)
    .where(
      and(
        parcelScope(scope),
        eq(parcels.id, scope.parcelId),
        sql`${parcels.pendingReceiverHandover}->>'id' = ${scope.handoverId}`,
        sql`${capture} is not null`,
      ),
    );
  if (!preview) throw NotFound('Signed handover not found');
  return preview;
}

async function lockParcel(input: Action, tx: DbExecutor) {
  const [parcel] = await tx
    .select()
    .from(parcels)
    .where(and(parcelScope(input), eq(parcels.id, input.parcelId)))
    .for('update');
  if (!parcel) throw NotFound('Parcel not found at this branch');
  return parcel;
}

function getPending(parcel: typeof parcels.$inferSelect, handoverId: string) {
  const pending = parcel.pendingReceiverHandover;
  if (pending?.id !== handoverId || parcel.status !== ParcelStatus.AWAITING_PICKUP) {
    throw Conflict('This handover changed. Reopen the parcel.');
  }
  const collectorId =
    pending.handoverTarget === 'main' ? parcel.receiverId : parcel.secondReceiverId;
  if (pending.receiverId !== parcel.receiverId || pending.collectorId !== collectorId) {
    throw Conflict('The parcel receiver changed. Ask a supervisor to review the handover.');
  }
  return pending;
}

export async function captureReceiverHandoverSignature(
  input: Action & { signature: ReceiverCashierSignature },
) {
  if (!isReceiverCashierSignature(input.signature)) throw BadRequest('Capture a usable signature');
  const result = await db.transaction(async (tx) => {
    const parcel = await lockParcel(input, tx);
    const pending = getPending(parcel, input.handoverId);
    if (pending.capture) return { id: parcel.id, signedAt: pending.capture.capturedAt };
    const capturedAt = new Date().toISOString();
    await tx
      .update(parcels)
      .set({
        pendingReceiverHandover: {
          ...pending,
          capture: { ...input.signature, capturedAt, capturedBy: input.actorId },
        },
        updatedAt: new Date(capturedAt),
      })
      .where(eq(parcels.id, parcel.id));
    return { id: parcel.id, signedAt: capturedAt };
  });
  signalReceiverHandoverChange(input);
  return result;
}

export async function confirmSignedReceiverHandover(input: Action) {
  const result = await db.transaction(async (tx) => {
    const parcel = await lockParcel(input, tx);
    if (
      parcel.status === ParcelStatus.DELIVERED_BY_OFFICE &&
      parcel.deliveryConfirmationSnapshot?.receiverCashierSignature?.handoverId === input.handoverId
    ) {
      return { id: parcel.id, alreadyConfirmed: true };
    }
    const pending = getPending(parcel, input.handoverId);
    if (!pending.capture) throw Conflict('The customer must sign before you confirm receipt');
    await assertActiveSessionSvc({
      cashierId: input.actorId,
      branchId: input.branchId,
      executor: tx,
    });
    const [collector] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, pending.collectorId),
          eq(customers.companyId, input.companyId),
          eq(customers.isDeleted, false),
        ),
      );
    if (!collector) throw Conflict('The collector is no longer available');
    await assertNoOpenParcelReconciliationCaseForDelivery(parcel.id, tx);
    await assertParcelFullyPaid(parcel.id, tx);
    const [payments, storage, [queue]] = await Promise.all([
      listPaymentsForParcelRepo(parcel.id, tx),
      getParcelStorageSettlementSvc(parcel.id, tx),
      tx
        .select({ id: pickupQueues.id })
        .from(pickupQueues)
        .where(
          and(
            eq(pickupQueues.parcelId, parcel.id),
            eq(pickupQueues.branchId, input.branchId),
            sql`${pickupQueues.endedAt} is null`,
          ),
        )
        .limit(1),
    ]);
    if (
      pending.snapshot.paymentIds.some((id) => !payments.some((payment) => payment.id === id)) ||
      storage.paidPsw + storage.waivedPsw < pending.storageAccruedPsw ||
      (queue?.id ?? null) !== pending.snapshot.pickupQueueId
    ) {
      throw Conflict('Payment, storage or the pickup ticket changed. Ask a supervisor to review.');
    }
    const confirmedAt = new Date();
    await tx
      .update(parcels)
      .set({
        status: ParcelStatus.DELIVERED_BY_OFFICE,
        confirmedAt,
        confirmedBy: pending.associateId,
        pendingReceiverHandover: null,
        updatedAt: confirmedAt,
        deliveryConfirmationSnapshot: {
          ...pending.snapshot,
          receiverCashierSignature: {
            ...pending.capture,
            handoverId: pending.id,
            collectorId: pending.collectorId,
            collectorName: pending.collectorName,
            handoverTarget: pending.handoverTarget,
          },
        },
      })
      .where(eq(parcels.id, parcel.id));
    await endPickupQueueForParcelSvc({ parcelId: parcel.id, endedBy: input.actorId }, tx);
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.actorId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'PARCEL_UPDATED',
      message: 'Signed Receiver Cashier handover confirmed',
      metadata: {
        patch: { status: ParcelStatus.DELIVERED_BY_OFFICE },
        previous: { status: ParcelStatus.AWAITING_PICKUP },
        signatureCaptured: true,
        handoverTarget: pending.handoverTarget,
        customerId: pending.collectorId,
        capturedBy: pending.capture.capturedBy,
        capturedAt: pending.capture.capturedAt,
        source: pending.capture.source,
        paymentProcessedBy: pending.requestedBy,
        otpVerified: pending.otpVerified,
      },
    });
    return { id: parcel.id, alreadyConfirmed: false };
  });
  signalReceiverHandoverChange(input);
  return result;
}
