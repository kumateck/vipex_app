import { and, eq, inArray, isNull } from 'drizzle-orm';
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
    })
    .from(parcels)
    .where(inArray(parcels.id, parcelIds));
}

export async function markIncomingParcelsArrivedRepo(
  input: {
    parcelIds: string[];
    companyId: string;
    branchId: string;
    receivedBy: string;
    receivedAt: Date;
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
    })
    .where(
      and(
        inArray(parcels.id, input.parcelIds),
        eq(parcels.companyId, input.companyId),
        eq(parcels.destinationId, input.branchId),
        eq(parcels.status, ParcelStatus.IN_TRANSIT),
        eq(parcels.isDeleted, false),
        isNull(parcels.receivedAt),
      ),
    )
    .returning({ id: parcels.id });
}
