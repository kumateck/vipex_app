import { asc, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations } from '@/db/schemas';
import { assertReceivingLocation, assertSendingLocation } from './location-capability.rules';

type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function assertBookingLocationCapabilitiesRepo(
  input: {
    companyId: string;
    sourceId: string;
    sourceLocationId?: string | null;
    parcels: Array<{ destinationId: string; pickupLocationId?: string | null }>;
  },
  tx: Executor,
) {
  const ids = [
    ...new Set(
      [input.sourceLocationId, ...input.parcels.map((parcel) => parcel.pickupLocationId)].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];
  if (!ids.length) return;
  const rows = await tx
    .select({
      id: locations.id,
      companyId: locations.companyId,
      branchId: locations.branchId,
      isDeleted: locations.isDeleted,
      canSend: locations.canSend,
      canReceive: locations.canReceive,
    })
    .from(locations)
    .where(inArray(locations.id, ids))
    .orderBy(asc(locations.id))
    .for('share');
  const byId = new Map(rows.map((row) => [row.id, row]));
  if (input.sourceLocationId)
    assertSendingLocation(
      byId.get(input.sourceLocationId) ?? null,
      input.companyId,
      input.sourceId,
    );
  for (const parcel of input.parcels) {
    if (parcel.pickupLocationId)
      assertReceivingLocation(
        byId.get(parcel.pickupLocationId) ?? null,
        input.companyId,
        parcel.destinationId,
      );
  }
}
