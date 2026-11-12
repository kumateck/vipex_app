import { BadRequest } from '@/server/utils/http-error';
import { lockReceivingOfficesRepo } from '../../locations/receiving-offices';
import type { DbExecutor } from '../parcel-repositories/parcel-repository.types';

export type OfficeCandidate = { id: string; locationId: string };

export function resolveReceivingOfficeId(
  locationId: string | null,
  offices: readonly OfficeCandidate[],
  selectedOfficeId?: string,
) {
  const matching = offices.filter((office) => office.locationId === locationId);
  if (selectedOfficeId) {
    if (!matching.some((office) => office.id === selectedOfficeId))
      throw BadRequest('Choose a receiving office at the parcel’s pickup location');
    return selectedOfficeId;
  }
  if (matching.length > 1) throw BadRequest('Select the receiving office for this parcel');
  return matching.length === 1 ? matching[0]!.id : null;
}

export async function resolveParcelReceivingOffices<T extends { pickupLocationId: string | null }>(
  parcels: T[],
  selectedOfficeId: string | undefined,
  tx: DbExecutor,
) {
  const locationIds = [...new Set(parcels.flatMap((parcel) => parcel.pickupLocationId ?? []))];
  const offices = locationIds.length ? await lockReceivingOfficesRepo(locationIds, tx) : [];
  return parcels.map((parcel) => ({
    ...parcel,
    receivingOfficeId: resolveReceivingOfficeId(parcel.pickupLocationId, offices, selectedOfficeId),
  }));
}
