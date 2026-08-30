import { ParcelStatus } from '@/db/schemas';
import { db } from '@/db/config';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { MAX_BULK_ARRIVAL_PARCELS } from '@/shared/shipments/bulk-arrival';
import { recordAuditLog } from '../audit/logger';
import {
  getBulkArrivalCandidatesRepo,
  markIncomingParcelsArrivedRepo,
  type BulkArrivalCandidate,
} from './parcel-bulk-receiving.repository';

export function normalizeBulkArrivalParcelIds(parcelIds: string[]) {
  const uniqueIds = [...new Set(parcelIds)];
  if (uniqueIds.length === 0) throw BadRequest('Select at least one parcel');
  if (uniqueIds.length !== parcelIds.length) {
    throw BadRequest('Duplicate parcel selections are not allowed');
  }
  if (uniqueIds.length > MAX_BULK_ARRIVAL_PARCELS) {
    throw BadRequest(`Select no more than ${MAX_BULK_ARRIVAL_PARCELS} parcels at a time`);
  }
  return uniqueIds;
}

export function assertBulkArrivalCandidates(input: {
  requestedParcelIds: string[];
  candidates: BulkArrivalCandidate[];
  companyId: string;
  branchId: string;
}) {
  if (input.candidates.length !== input.requestedParcelIds.length) {
    throw NotFound('One or more selected parcels are unavailable');
  }

  const inaccessible = input.candidates.some(
    (parcel) =>
      parcel.companyId !== input.companyId ||
      parcel.destinationId !== input.branchId ||
      parcel.isDeleted,
  );
  if (inaccessible) throw NotFound('One or more selected parcels are unavailable');

  const ineligible = input.candidates.filter(
    (parcel) => parcel.status !== ParcelStatus.IN_TRANSIT || parcel.receivedAt !== null,
  );
  if (ineligible.length > 0) {
    throw Conflict('One or more selected parcels can no longer be marked as arrived', {
      parcelIds: ineligible.map((parcel) => parcel.id),
    });
  }
}

export async function markIncomingParcelsArrivedSvc(input: {
  parcelIds: string[];
  companyId: string;
  branchId: string;
  actorUserId: string;
}) {
  if (!input.companyId || !input.branchId || !input.actorUserId) {
    throw BadRequest('Company, receiving branch, and user context are required');
  }

  const parcelIds = normalizeBulkArrivalParcelIds(input.parcelIds);

  const receivedAt = new Date();
  const updatedIds = await db.transaction(async (tx) => {
    const candidates = await getBulkArrivalCandidatesRepo(parcelIds, tx);
    assertBulkArrivalCandidates({
      requestedParcelIds: parcelIds,
      candidates,
      companyId: input.companyId,
      branchId: input.branchId,
    });

    const updated = await markIncomingParcelsArrivedRepo(
      {
        parcelIds,
        companyId: input.companyId,
        branchId: input.branchId,
        receivedBy: input.actorUserId,
        receivedAt,
      },
      tx,
    );
    if (updated.length !== parcelIds.length) {
      throw Conflict('The selected parcels changed while the batch was being processed');
    }
    return updated.map((parcel) => parcel.id);
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel_batch',
    action: 'PARCELS_BULK_RECEIVED',
    message: `${updatedIds.length} incoming parcels marked as arrived`,
    metadata: {
      parcelIds: updatedIds,
      branchId: input.branchId,
      receivedAt: receivedAt.toISOString(),
    },
  });

  return {
    parcelIds: updatedIds,
    updatedCount: updatedIds.length,
    receivedAt: receivedAt.toISOString(),
  };
}
