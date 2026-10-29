import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations, parcels } from '@/db/schemas';

export async function getParcelSmsLocationRepo(companyId: string, parcelId: string) {
  const [row] = await db
    .select({
      location: locations.name,
      locationPhone: locations.telephone,
    })
    .from(parcels)
    .leftJoin(
      locations,
      and(
        eq(locations.id, parcels.pickupLocationId),
        eq(locations.companyId, companyId),
        eq(locations.branchId, parcels.destinationId),
        eq(locations.isDeleted, false),
      ),
    )
    .where(
      and(eq(parcels.id, parcelId), eq(parcels.companyId, companyId), eq(parcels.isDeleted, false)),
    )
    .limit(1);
  return row ?? null;
}
