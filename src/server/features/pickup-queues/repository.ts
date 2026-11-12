import { receivingOfficeJoin } from '../shipments/parcel-receiving-office/projection';
import { and, asc, desc, eq, isNull, max, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { handoverNoteProjection } from '../shipments/handover-note/projection';
import {
  customers,
  locations,
  parcels,
  ParcelStatus,
  pickupQueues,
  receivingOffices,
} from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function lockPickupQueueParcelRepo(parcelId: string, executor: DbExecutor) {
  const [parcel] = await executor
    .select({
      status: parcels.status,
      pickupLocationId: parcels.pickupLocationId,
      destinationId: parcels.destinationId,
      hasPendingReceiverHandover: sql<boolean>`${parcels.pendingReceiverHandover} is not null`,
    })
    .from(parcels)
    .where(and(eq(parcels.id, parcelId), eq(parcels.isDeleted, false)))
    .for('update');
  return parcel;
}

export async function lockPickupQueueNumberRepo(
  branchId: string,
  locationId: string | null,
  queueDate: Date,
  executor: DbExecutor,
) {
  const scope = `pickup-queue:${branchId}:${locationId ?? ''}:${queueDate.toISOString()}`;
  await executor.execute(sql`select pg_advisory_xact_lock(hashtextextended(${scope}, 0))`);
}

export async function getPickupQueueByParcelRepo(parcelId: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(pickupQueues)
    .where(and(eq(pickupQueues.parcelId, parcelId), isNull(pickupQueues.endedAt)))
    .orderBy(desc(pickupQueues.queueDate), desc(pickupQueues.queuedAt), desc(pickupQueues.id))
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

export async function endOpenPickupQueuesRepo(
  input: { parcelId: string; endedBy?: string | null },
  executor: DbExecutor = db,
) {
  const endedAt = new Date();
  await executor
    .update(pickupQueues)
    .set({ endedAt, endedBy: input.endedBy ?? null, updatedAt: endedAt })
    .where(and(eq(pickupQueues.parcelId, input.parcelId), isNull(pickupQueues.endedAt)));
}

export async function listActivePickupQueuesForBranchRepo(
  input: { branchId: string; paymentBucket?: string | null; queueDate?: Date },
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
      ...handoverNoteProjection,
      pickupLocationName: locations.name,
      receivingOfficeName: receivingOffices.name,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      chargePsw: parcels.chargePsw,
      callSender: parcels.callSender,
      receiverName: sql<string>`coalesce(nullif(btrim(${parcels.receiverNameSnapshot}), ''), ${receiver.fullname}, '')`,
      receiverPhone: receiver.telephone,
    })
    .from(pickupQueues)
    .innerJoin(parcels, eq(parcels.id, pickupQueues.parcelId))
    .leftJoin(locations, eq(locations.id, parcels.pickupLocationId))
    .leftJoin(receivingOffices, receivingOfficeJoin)
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(
      and(
        eq(pickupQueues.branchId, input.branchId),
        isNull(pickupQueues.endedAt),
        eq(parcels.status, ParcelStatus.AWAITING_PICKUP),
        eq(parcels.isDeleted, false),
        isNull(parcels.pendingReceiverHandover),
        input.paymentBucket ? eq(pickupQueues.paymentBucket, input.paymentBucket) : undefined,
        input.queueDate ? eq(pickupQueues.queueDate, input.queueDate) : undefined,
      ),
    )
    .orderBy(asc(pickupQueues.queuedAt), asc(pickupQueues.queueNumber));
}
