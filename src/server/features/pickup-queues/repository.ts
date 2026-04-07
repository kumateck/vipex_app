import { and, asc, eq, isNull, max } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { customers, parcels, pickupQueues } from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function getPickupQueueByParcelRepo(parcelId: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(pickupQueues)
    .where(and(eq(pickupQueues.parcelId, parcelId), isNull(pickupQueues.endedAt)))
    .limit(1);
  return row ?? null;
}

export async function getPickupQueueByParcelAndDateRepo(
  input: { parcelId: string; queueDate: Date },
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select()
    .from(pickupQueues)
    .where(
      and(
        eq(pickupQueues.parcelId, input.parcelId),
        eq(pickupQueues.queueDate, input.queueDate),
        isNull(pickupQueues.endedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getNextPickupQueueNumberRepo(
  input: { branchId: string; locationId?: string | null; queueDate: Date },
  executor: DbExecutor = db,
) {
  const locationClause =
    input.locationId === undefined
      ? undefined
      : input.locationId === null
        ? isNull(pickupQueues.locationId)
        : eq(pickupQueues.locationId, input.locationId);

  const [row] = await executor
    .select({ value: max(pickupQueues.queueNumber) })
    .from(pickupQueues)
    .where(
      and(
        eq(pickupQueues.branchId, input.branchId),
        locationClause,
        eq(pickupQueues.queueDate, input.queueDate),
      ),
    );

  return Number(row?.value ?? 0) + 1;
}

export async function createPickupQueueRepo(
  values: typeof pickupQueues.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(pickupQueues)
    .values(values)
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function updatePickupQueueRepo(
  id: string,
  patch: Partial<typeof pickupQueues.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(pickupQueues)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(pickupQueues.id, id))
    .returning();
  return row ?? null;
}

export async function listActivePickupQueuesForBranchRepo(
  branchId: string,
  paymentBucket?: string | null,
  executor: DbExecutor = db,
) {
  const receiver = alias(customers, 'receiver');

  return executor
    .select({
      id: pickupQueues.id,
      companyId: pickupQueues.companyId,
      branchId: pickupQueues.branchId,
      locationId: pickupQueues.locationId,
      parcelId: pickupQueues.parcelId,
      paymentBucket: pickupQueues.paymentBucket,
      queueDate: pickupQueues.queueDate,
      queueNumber: pickupQueues.queueNumber,
      queueCode: pickupQueues.queueCode,
      pickerStaffId: pickupQueues.pickerStaffId,
      idCardTypeId: pickupQueues.idCardTypeId,
      idCardNumber: pickupQueues.idCardNumber,
      queuedBy: pickupQueues.queuedBy,
      queuedAt: pickupQueues.queuedAt,
      endedAt: pickupQueues.endedAt,
      endedBy: pickupQueues.endedBy,
      createdAt: pickupQueues.createdAt,
      updatedAt: pickupQueues.updatedAt,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      parcelDetails: parcels.parcelDetails,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      chargePsw: parcels.chargePsw,
      receiverName: receiver.fullname,
      receiverPhone: receiver.telephone,
    })
    .from(pickupQueues)
    .innerJoin(parcels, eq(parcels.id, pickupQueues.parcelId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(
      and(
        eq(pickupQueues.branchId, branchId),
        isNull(pickupQueues.endedAt),
        paymentBucket ? eq(pickupQueues.paymentBucket, paymentBucket) : undefined,
      ),
    )
    .orderBy(asc(pickupQueues.queuedAt), asc(pickupQueues.queueNumber));
}
