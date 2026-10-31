import { and, eq, inArray, isNull, sql, asc } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, ParcelStatus } from '@/db/schemas';

export type BulkArrivalCandidate = {
  id: string;
  companyId: string;
  destinationId: string;
  bookingCode: string;
  status: number;
  receivedAt: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  confirmedAt?: Date | null;
  pickupLocationId?: string | null;
};

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export function getBulkArrivalCandidatesRepo(parcelIds: string[], executor: DbExecutor = db) {
  if (parcelIds.length === 0) return Promise.resolve([] as BulkArrivalCandidate[]);

  return executor
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      destinationId: parcels.destinationId,
      bookingCode: parcels.bookingCode,
      status: parcels.status,
      receivedAt: parcels.receivedAt,
      isDeleted: parcels.isDeleted,
      deletedAt: parcels.deletedAt,
      confirmedAt: parcels.confirmedAt,
      pickupLocationId: parcels.pickupLocationId,
    })
    .from(parcels)
    .where(inArray(parcels.id, parcelIds))
    .orderBy(asc(parcels.id))
    .for('update');
}

export async function markIncomingParcelsArrivedRepo(
  input: {
    parcelIds: string[];
    companyId: string;
    branchId: string;
    receivedBy: string;
    receivedAt: Date;
    resolvedLocations: Array<{ id: string; pickupLocationId: string | null }>;
  },
  executor: DbExecutor = db,
) {
  return executor
    .update(parcels)
    .set({
      receivedBy: input.receivedBy,
      receivedAt: input.receivedAt,
      status: ParcelStatus.ARRIVED_AT_DESTINATION,
      updatedAt: input.receivedAt,
      pickupLocationId: sql`case ${sql.join(
        input.resolvedLocations.map(
          (parcel) =>
            sql`when ${parcels.id} = ${parcel.id} then ${parcel.pickupLocationId}::varchar`,
        ),
        sql` `,
      )}
        else ${parcels.pickupLocationId} end`,
    })
    .where(
      and(
        inArray(parcels.id, input.parcelIds),
        eq(parcels.companyId, input.companyId),
        eq(parcels.destinationId, input.branchId),
        eq(parcels.status, ParcelStatus.IN_TRANSIT),
        eq(parcels.isDeleted, false),
        isNull(parcels.receivedAt),
        isNull(parcels.deletedAt),
        isNull(parcels.confirmedAt),
      ),
    )
    .returning({ id: parcels.id });
}
