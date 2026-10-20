import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels } from '@/db/schemas';

export async function getParcelCallResendTargetRepo(companyId: string, parcelId: string) {
  const [parcel] = await db
    .select({
      companyId: parcels.companyId,
      destinationId: parcels.destinationId,
      callCenterAssignedToUserId: parcels.callCenterAssignedToUserId,
      callCenterCalledAt: parcels.callCenterCalledAt,
      status: parcels.status,
      isDeleted: parcels.isDeleted,
    })
    .from(parcels)
    .where(and(eq(parcels.id, parcelId), eq(parcels.companyId, companyId)))
    .limit(1);
  return parcel ?? null;
}
