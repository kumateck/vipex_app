import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { auditLogs, branches, consignmentItems, consignments, parcels } from '@/db/schemas';

export async function getPublicParcelByTrackingRepo(trackingCode: string) {
  const sourceBranch = alias(branches, 'public_tracking_source_branch');
  const destinationBranch = alias(branches, 'public_tracking_destination_branch');

  const [row] = await db
    .select({
      id: parcels.id,
      trackingCode: parcels.trackingCode,
      receiptCode: parcels.bookingCode,
      senderName: parcels.senderNameSnapshot,
      receiverName: parcels.receiverNameSnapshot,
      secondReceiverName: parcels.secondReceiverNameSnapshot,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      parcelValuePsw: parcels.parcelValuePsw,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      status: parcels.status,
      createdAt: parcels.createdAt,
      updatedAt: parcels.updatedAt,
      receivedAt: parcels.receivedAt,
      sourceBranchName: sourceBranch.name,
      destinationBranchName: destinationBranch.name,
      sentAt: consignments.createdAt,
      consignmentCode: consignments.code,
    })
    .from(parcels)
    .innerJoin(sourceBranch, eq(sourceBranch.id, parcels.sourceId))
    .innerJoin(destinationBranch, eq(destinationBranch.id, parcels.destinationId))
    .leftJoin(
      consignmentItems,
      and(eq(consignmentItems.parcelId, parcels.id), isNull(consignmentItems.removedAt)),
    )
    .leftJoin(consignments, eq(consignments.id, consignmentItems.consignmentId))
    .where(and(eq(parcels.trackingCode, trackingCode), eq(parcels.isDeleted, false)))
    .orderBy(desc(consignmentItems.addedAt), desc(parcels.updatedAt))
    .limit(1);

  if (!row) return null;

  const events = await db
    .select({ metadata: auditLogs.metadata, createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, 'parcel'),
        eq(auditLogs.entityId, row.id),
        eq(auditLogs.action, 'PARCEL_UPDATED'),
      ),
    )
    .orderBy(asc(auditLogs.createdAt), asc(auditLogs.id));

  return { ...row, events };
}
