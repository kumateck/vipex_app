import { ParcelStatus } from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { MAX_BULK_ARRIVAL_PARCELS } from '@/shared/shipments/bulk-arrival';
import type { BulkArrivalCandidate } from '../parcel-bulk-receiving.repository';

export function normalizeBulkArrivalParcelIds(parcelIds: string[]) {
  const uniqueIds = [...new Set(parcelIds)];
  if (!uniqueIds.length) throw BadRequest('Select at least one parcel');
  if (uniqueIds.length !== parcelIds.length)
    throw BadRequest('Duplicate parcel selections are not allowed');
  if (uniqueIds.length > MAX_BULK_ARRIVAL_PARCELS)
    throw BadRequest(`Select no more than ${MAX_BULK_ARRIVAL_PARCELS} parcels at a time`);
  return uniqueIds;
}
export function assertBulkArrivalCandidates(input: {
  requestedParcelIds: string[];
  candidates: BulkArrivalCandidate[];
  companyId: string;
  branchId: string;
}) {
  if (
    input.candidates.length !== input.requestedParcelIds.length ||
    input.candidates.some(
      (parcel) =>
        parcel.companyId !== input.companyId ||
        parcel.destinationId !== input.branchId ||
        parcel.isDeleted ||
        parcel.deletedAt,
    )
  )
    throw NotFound('One or more selected parcels are unavailable');
  const ineligible = input.candidates.filter(
    (parcel) =>
      parcel.status !== ParcelStatus.IN_TRANSIT || parcel.receivedAt !== null || parcel.confirmedAt,
  );
  if (ineligible.length)
    throw Conflict('One or more selected parcels can no longer be marked as arrived', {
      parcelIds: ineligible.map((parcel) => parcel.id),
    });
}
