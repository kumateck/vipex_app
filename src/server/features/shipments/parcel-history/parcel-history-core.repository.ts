import { and, asc, eq, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, consignmentItems, consignments, deliveries, payments } from '@/db/schemas';

/** Audit entries about this parcel, including batch entries that list it. */
export function listParcelAuditEntriesRepo(parcelId: string) {
  return db
    .select({
      id: auditLogs.id,
      entityType: auditLogs.entityType,
      action: auditLogs.action,
      message: auditLogs.message,
      metadata: auditLogs.metadata,
      actorUserId: auditLogs.actorUserId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(
      or(
        and(eq(auditLogs.entityType, 'parcel'), eq(auditLogs.entityId, parcelId)),
        and(eq(auditLogs.entityType, 'notification_dispatch'), eq(auditLogs.entityId, parcelId)),
        and(
          eq(auditLogs.entityType, 'delivery'),
          sql`(${auditLogs.metadata} ->> 'parcelId') = ${parcelId}`,
        ),
        and(
          eq(auditLogs.entityType, 'parcel_batch'),
          sql`coalesce(${auditLogs.metadata}::jsonb -> 'parcelIds', '[]'::jsonb) ? ${parcelId}`,
        ),
      ),
    )
    .orderBy(asc(auditLogs.createdAt), asc(auditLogs.id));
}

export function listParcelConsignmentMovesRepo(parcelId: string) {
  return db
    .select({
      consignmentId: consignmentItems.consignmentId,
      code: consignments.code,
      sourceId: consignments.sourceId,
      destinationId: consignments.destinationId,
      createdBy: consignments.createdBy,
      addedAt: consignmentItems.addedAt,
      removedAt: consignmentItems.removedAt,
      arrivedAt: consignmentItems.arrivedAt,
      arrivedBy: consignmentItems.arrivedBy,
      closedAt: consignments.closedAt,
      closedBy: consignments.closedBy,
    })
    .from(consignmentItems)
    .innerJoin(consignments, eq(consignments.id, consignmentItems.consignmentId))
    .where(eq(consignmentItems.parcelId, parcelId));
}

export function listParcelPaymentEventsRepo(parcelId: string) {
  return db
    .select({
      id: payments.id,
      branchId: payments.branchId,
      component: payments.component,
      payer: payments.payer,
      method: payments.method,
      cashierUserId: payments.cashierUserId,
      grossAmountPsw: payments.grossAmountPsw,
      receiptNo: payments.receiptNo,
      notes: payments.notes,
      receivedAt: payments.receivedAt,
      voidedAt: payments.voidedAt,
      voidedBy: payments.voidedBy,
      voidReason: payments.voidReason,
    })
    .from(payments)
    .where(eq(payments.parcelId, parcelId));
}

export function listParcelDeliveryEventsRepo(parcelId: string) {
  return db
    .select({
      id: deliveries.id,
      mode: deliveries.mode,
      status: deliveries.status,
      dropoffAddress: deliveries.dropoffAddress,
      chargePsw: deliveries.chargePsw,
      createdAt: deliveries.createdAt,
      createdBy: deliveries.createdBy,
      riderUserId: deliveries.riderUserId,
      riderAssignedAt: deliveries.riderAssignedAt,
      riderCompletedAt: deliveries.riderCompletedAt,
      returnedAt: deliveries.returnedAt,
      riderCollectedPrincipalPsw: deliveries.riderCollectedPrincipalPsw,
      riderCollectedDeliveryFeePsw: deliveries.riderCollectedDeliveryFeePsw,
      riderCollectionRecordedAt: deliveries.riderCollectionRecordedAt,
      receiverCalledConfirmedBy: deliveries.receiverCalledConfirmedBy,
      receiverCalledConfirmedAt: deliveries.receiverCalledConfirmedAt,
      deliveredAt: deliveries.deliveredAt,
      confirmedBy: deliveries.confirmedBy,
      confirmedAt: deliveries.confirmedAt,
    })
    .from(deliveries)
    .where(eq(deliveries.parcelId, parcelId));
}
