import { ParcelStatus } from '@/db/schemas';
import { auditLogs } from '@/db/schemas/audit';
import { db } from '@/db/config';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { listOpenParcelDiscrepanciesRepo } from '../parcel-discrepancies.repository';
import { listParcelsRepo } from '../parcels.repository';
import { isSchemaCompatibilityError, getAuditMetadataNote } from './helpers';

export async function listOpenParcelDiscrepanciesSvc(input: {
  companyId: string;
  branchId?: string | null;
  limit: number;
  offset: number;
  search?: string | null;
}) {
  try {
    return await listOpenParcelDiscrepanciesRepo(input);
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;

    const { data, totalRecords } = await listParcelsRepo({
      limit: input.limit,
      offset: input.offset,
      companyId: input.companyId,
      destinationId: input.branchId ?? null,
      status: ParcelStatus.DISCREPANCY,
      statuses: null,
      sourceId: null,
      locationId: null,
      senderPaid: null,
      search: input.search ?? null,
      received: null,
      includeDeleted: false,
      sort: null,
    });

    const parcelIds = data.map((parcel) => parcel.id);
    const noteByParcelId = new Map<string, { note: string | null; createdAt: Date }>();

    if (parcelIds.length > 0) {
      const auditRows = await db
        .select({
          entityId: auditLogs.entityId,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.companyId, input.companyId),
            eq(auditLogs.action, 'PARCEL_DISCREPANCY_LOGGED'),
            eq(auditLogs.entityType, 'parcel_discrepancy'),
            inArray(auditLogs.entityId, parcelIds),
          ),
        )
        .orderBy(desc(auditLogs.createdAt));

      for (const row of auditRows) {
        if (!row.entityId || noteByParcelId.has(row.entityId)) continue;
        noteByParcelId.set(row.entityId, {
          note: getAuditMetadataNote(row.metadata),
          createdAt: row.createdAt,
        });
      }
    }

    return {
      data: data.map((parcel) => ({
        // Compatibility mode fallback when parcel_discrepancies table is not yet available.
        id: parcel.id,
        parcelId: parcel.id,
        branchId: parcel.destinationId,
        branchName: parcel.destinationName ?? null,
        trackingCode: parcel.trackingCode,
        bookingCode: parcel.bookingCode,
        discrepancyType: 'record_not_physical',
        notes: noteByParcelId.get(parcel.id)?.note ?? null,
        createdBy: parcel.createdBy,
        createdByName: null,
        createdAt: noteByParcelId.get(parcel.id)?.createdAt ?? parcel.updatedAt,
        parcelStatus: parcel.status,
        sourceId: parcel.sourceId,
        destinationId: parcel.destinationId,
        pickupLocationId: parcel.pickupLocationId,
        destinationLocationName: parcel.pickupLocationName ?? null,
        senderName: parcel.senderName,
        receiverName: parcel.receiverName,
      })),
      totalRecords,
    };
  }
}
