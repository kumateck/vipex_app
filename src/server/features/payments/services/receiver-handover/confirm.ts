import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, customers, parcels, ParcelStatus, pickupQueues } from '@/db/schemas';
import { Conflict } from '@/server/utils/http-error';
import { assertActiveSessionSvc } from '../../../cashiers/service';
import { endPickupQueueForParcelSvc } from '../../../pickup-queues/service';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../../../shipments/parcel-delivery-reconciliation-guard';
import { assertParcelFullyPaid } from '../../../shipments/parcel-payment-settlement';
import { getParcelStorageSettlementSvc } from '../../../shipments/parcels.service';
import { listPaymentsForParcelRepo } from '../../repository';
import { signalReceiverHandoverChange } from '../receiver-handover-changes';
import { lockParcel, getPending, type Action } from './scope';
import { settlePendingReceiverPayments } from './settle-payment';

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
    const pickupQueueId = pending.snapshot.pickupQueueId;
    const [payments, storage, [queue]] = await Promise.all([
      listPaymentsForParcelRepo(parcel.id, tx),
      getParcelStorageSettlementSvc(parcel.id, tx),
      pickupQueueId
        ? tx
            .select({ id: pickupQueues.id })
            .from(pickupQueues)
            .where(
              and(
                eq(pickupQueues.id, pickupQueueId),
                eq(pickupQueues.parcelId, parcel.id),
                eq(pickupQueues.branchId, input.branchId),
                sql`${pickupQueues.endedAt} is null`,
              ),
            )
            .limit(1)
        : [],
    ]);
    if (
      pending.snapshot.paymentIds.some((id) => !payments.some((payment) => payment.id === id)) ||
      (!pending.paymentPlan && storage.paidPsw + storage.waivedPsw < pending.storageAccruedPsw) ||
      (queue?.id ?? null) !== pickupQueueId
    ) {
      throw Conflict('Payment, storage or the pickup ticket changed. Ask a supervisor to review.');
    }
    const snapshot = await settlePendingReceiverPayments(parcel.id, pending, input.actorId, tx);
    await assertParcelFullyPaid(parcel.id, tx);
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
          ...snapshot,
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
        paymentProcessedBy: pending.paymentPlan ? input.actorId : pending.requestedBy,
        paymentRequestedBy: pending.requestedBy,
        otpVerified: pending.otpVerified,
      },
    });
    return { id: parcel.id, alreadyConfirmed: false };
  });
  signalReceiverHandoverChange(input);
  return result;
}
