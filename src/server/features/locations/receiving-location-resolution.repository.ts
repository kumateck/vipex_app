import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations } from '@/db/schemas';
import { BadRequest } from '@/server/utils/http-error';
import { assertReceivingLocation } from './location-capability.rules';

type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
type Destination = { destinationId: string; pickupLocationId?: string | null };

export async function resolveReceivingPickupLocationsRepo<T extends Destination>(
  companyId: string,
  parcels: readonly T[],
  tx: Executor = db,
): Promise<Array<T & { pickupLocationId: string | null }>> {
  if (!parcels.length) return [];
  const rows = await tx
    .select({
      id: locations.id,
      companyId: locations.companyId,
      branchId: locations.branchId,
      isDeleted: locations.isDeleted,
      canReceive: locations.canReceive,
    })
    .from(locations)
    .where(
      and(
        eq(locations.companyId, companyId),
        eq(locations.isDeleted, false),
        inArray(locations.branchId, [...new Set(parcels.map((parcel) => parcel.destinationId))]),
      ),
    )
    .orderBy(asc(locations.id))
    .for('share');
  const byId = new Map(rows.map((row) => [row.id, row]));
  const byBranch = new Map<string, typeof rows>();
  for (const row of rows) {
    const branch = byBranch.get(row.branchId) ?? [];
    branch.push(row);
    byBranch.set(row.branchId, branch);
  }
  return parcels.map((parcel) => {
    if (parcel.pickupLocationId) {
      assertReceivingLocation(
        byId.get(parcel.pickupLocationId) ?? null,
        companyId,
        parcel.destinationId,
      );
      return { ...parcel, pickupLocationId: parcel.pickupLocationId };
    }
    const branchLocations = byBranch.get(parcel.destinationId) ?? [];
    const receiving = branchLocations.filter((location) => location.canReceive);
    if (receiving.length > 1)
      throw BadRequest('Select a pickup location for this destination branch');
    if (branchLocations.length && !receiving.length)
      throw BadRequest('This destination branch has no receiving-enabled location');
    return { ...parcel, pickupLocationId: receiving[0]?.id ?? null };
  });
}
