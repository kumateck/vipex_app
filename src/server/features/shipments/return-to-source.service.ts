import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, ParcelStatus } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { endPickupQueueForParcelSvc } from '../pickup-queues/service';
import { getOpenReconciliationCaseBlockingDeliveryRepo } from './parcel-reconciliation-cases.repository';
import { canReturnParcelToSource } from '@/shared/shipments/return-to-source';

export async function returnParcelToSourceSvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (reason.length < 5 || reason.length > 500) {
    throw BadRequest('Enter a return reason of 5 to 500 characters');
  }
  if (!input.companyId || !input.branchId) throw BadRequest('Company and branch are required');

  const parcel = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: parcels.id,
        trackingCode: parcels.trackingCode,
        bookingCode: parcels.bookingCode,
        sourceId: parcels.sourceId,
        status: parcels.status,
      })
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.isDeleted, false),
        ),
      )
      .for('update');
    if (!current) throw NotFound('Parcel not found at your destination branch');
    if (current.sourceId === input.branchId) {
      throw Conflict('Source and destination branches must differ');
    }
    if (!canReturnParcelToSource(current.status)) {
      throw Conflict('Parcel must be at the destination branch and not handed to a customer');
    }
    if (await getOpenReconciliationCaseBlockingDeliveryRepo(current.id, tx)) {
      throw Conflict('Resolve the open reconciliation case before returning this parcel');
    }

    await tx
      .update(parcels)
      .set({ status: ParcelStatus.RETURN_TO_SOURCE, updatedAt: new Date() })
      .where(eq(parcels.id, current.id));
    await endPickupQueueForParcelSvc({ parcelId: current.id, endedBy: input.actorUserId }, tx);
    return current;
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: parcel.id,
    action: 'PARCEL_RETURN_TO_SOURCE_RECORDED',
    message: `Return to source recorded for parcel ${parcel.trackingCode}`,
    metadata: {
      reason,
      bookingCode: parcel.bookingCode,
      fromBranchId: input.branchId,
      toBranchId: parcel.sourceId,
    },
  });

  return { id: parcel.id, status: ParcelStatus.RETURN_TO_SOURCE };
}
