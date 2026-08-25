import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { deliveries, parcels, users } from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

const requestSelection = {
  deliveryId: deliveries.id,
  parcelId: deliveries.parcelId,
  companyId: parcels.companyId,
  branchId: parcels.destinationId,
  parcelStatus: parcels.status,
  bookingCode: parcels.bookingCode,
  trackingCode: parcels.trackingCode,
  riderUserId: deliveries.riderUserId,
  riderName: users.fullname,
  mode: deliveries.mode,
  currentDropoffAddress: deliveries.dropoffAddress,
  currentChargePsw: deliveries.chargePsw,
  status: deliveries.changeRequestStatus,
  requestedDropoffAddress: deliveries.requestedDropoffAddress,
  requestedChargePsw: deliveries.requestedChargePsw,
  reason: deliveries.changeRequestReason,
  requestedAt: deliveries.changeRequestedAt,
  reviewNote: deliveries.changeReviewNote,
} as const;

function requestQuery(executor: DbExecutor = db) {
  return executor
    .select(requestSelection)
    .from(deliveries)
    .innerJoin(parcels, eq(parcels.id, deliveries.parcelId))
    .leftJoin(users, eq(users.id, deliveries.riderUserId));
}

export async function getDeliveryChangeContextByParcelRepo(
  parcelId: string,
  executor: DbExecutor = db,
) {
  const [row] = await requestQuery(executor).where(eq(deliveries.parcelId, parcelId)).limit(1);
  return row ?? null;
}

export async function getDeliveryChangeContextByIdRepo(
  deliveryId: string,
  executor: DbExecutor = db,
) {
  const [row] = await requestQuery(executor).where(eq(deliveries.id, deliveryId)).limit(1);
  return row ?? null;
}

export function listPendingDeliveryChangesForRiderRepo(riderUserId: string) {
  return requestQuery()
    .where(
      and(eq(deliveries.riderUserId, riderUserId), eq(deliveries.changeRequestStatus, 'PENDING')),
    )
    .orderBy(desc(deliveries.changeRequestedAt));
}

export function listPendingDeliveryChangesForBranchRepo(branchId: string) {
  return requestQuery()
    .where(and(eq(parcels.destinationId, branchId), eq(deliveries.changeRequestStatus, 'PENDING')))
    .orderBy(desc(deliveries.changeRequestedAt));
}

export async function updateDeliveryChangeRequestRepo(
  deliveryId: string,
  patch: Partial<typeof deliveries.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(deliveries)
    .set(patch)
    .where(eq(deliveries.id, deliveryId))
    .returning({ id: deliveries.id });
  return row ?? null;
}

export async function decidePendingDeliveryChangeRequestRepo(
  deliveryId: string,
  patch: Partial<typeof deliveries.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(deliveries)
    .set(patch)
    .where(and(eq(deliveries.id, deliveryId), eq(deliveries.changeRequestStatus, 'PENDING')))
    .returning({ id: deliveries.id });
  return row ?? null;
}

export async function hasPendingDeliveryChangeRequestRepo(
  deliveryId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({ id: deliveries.id })
    .from(deliveries)
    .where(and(eq(deliveries.id, deliveryId), eq(deliveries.changeRequestStatus, 'PENDING')))
    .limit(1);
  return Boolean(row);
}
