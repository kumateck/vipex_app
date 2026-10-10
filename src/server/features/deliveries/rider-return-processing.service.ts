import { db } from '@/db/config';
import { parcels } from '@/db/schemas';
import { recordAuditLog } from '@/server/features/audit/logger';
import { eq } from 'drizzle-orm';
import { ParcelStatus, UserStatus, UserType } from '@/db/schemas/enums';
import { getParcelRepo, updateParcelRepo } from '@/server/features/shipments/parcels.repository';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '@/server/features/shipments/parcel-delivery-reconciliation-guard';
import { getUserRepo } from '@/server/features/users/repository';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { emitRiderAssignmentsCreated } from '@/server/features/communication/realtime';
import { getDeliveryByParcelRepo, updateDeliveryRepo } from './repository';
import { assertRiderReturnReadyForPickup } from './rider-return-processing.rules';

export async function reprocessRiderReturnForPickupSvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
}) {
  const result = await db.transaction(async (tx) => {
    await tx
      .select({ id: parcels.id })
      .from(parcels)
      .where(eq(parcels.id, input.parcelId))
      .for('update');
    const parcel = await getParcelRepo(input.parcelId, tx);
    const delivery = await getDeliveryByParcelRepo(input.parcelId, tx);
    assertRiderReturnReadyForPickup({
      parcel,
      delivery,
      companyId: input.companyId,
      branchId: input.branchId,
    });
    if (!parcel) throw NotFound('Returned parcel not found at this branch');
    await updateParcelRepo(parcel.id, { status: ParcelStatus.AWAITING_PICKUP }, tx);
    return { id: parcel.id, trackingCode: parcel.trackingCode };
  });
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: result.id,
    action: 'PARCEL_UPDATED',
    message: `Rider return ${result.trackingCode} moved to office pickup`,
    metadata: {
      patch: { status: ParcelStatus.AWAITING_PICKUP },
      previous: { status: ParcelStatus.RETURNED_TO_OFFICE },
    },
  });
  return { id: result.id };
}

async function assertActiveBranchRider(riderUserId: string, companyId: string, branchId: string) {
  const rider = await getUserRepo(riderUserId);
  if (
    !rider ||
    rider.companyId !== companyId ||
    rider.branchId !== branchId ||
    rider.userType !== UserType.RIDER ||
    rider.status !== UserStatus.ACTIVE
  ) {
    throw Conflict('Select an active rider at this branch');
  }
  return rider;
}

export async function redispatchRiderReturnSvc(input: {
  parcelId: string;
  riderUserId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
}) {
  const rider = await assertActiveBranchRider(input.riderUserId, input.companyId, input.branchId);
  const result = await db.transaction(async (tx) => {
    await tx
      .select({ id: parcels.id })
      .from(parcels)
      .where(eq(parcels.id, input.parcelId))
      .for('update');
    const parcel = await getParcelRepo(input.parcelId, tx);
    const delivery = await getDeliveryByParcelRepo(input.parcelId, tx);
    assertRiderReturnReadyForPickup({
      parcel,
      delivery,
      companyId: input.companyId,
      branchId: input.branchId,
    });
    if (!parcel || !delivery) throw NotFound('Returned parcel not found at this branch');
    await assertNoOpenParcelReconciliationCaseForDelivery(parcel.id, tx);
    const assignedAt = new Date();
    await updateDeliveryRepo(
      delivery.id,
      {
        status: 'DISPATCHED',
        riderUserId: rider.id,
        riderAssignedAt: assignedAt,
        updatedAt: assignedAt,
      },
      tx,
    );
    await updateParcelRepo(parcel.id, { status: ParcelStatus.DISPATCHED }, tx);
    return { id: parcel.id, trackingCode: parcel.trackingCode };
  });
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: result.id,
    action: 'PARCEL_UPDATED',
    message: `Rider return ${result.trackingCode} redispatched`,
    metadata: {
      patch: { status: ParcelStatus.DISPATCHED, riderUserId: rider.id },
      previous: { status: ParcelStatus.RETURNED_TO_OFFICE },
    },
  });
  emitRiderAssignmentsCreated({
    companyId: input.companyId,
    riderUserId: rider.id,
    parcelIds: [result.id],
  });
  return { id: result.id };
}

export async function redispatchRiderReturnsBulkSvc(input: {
  parcelIds: string[];
  riderUserId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
}) {
  await assertActiveBranchRider(input.riderUserId, input.companyId, input.branchId);
  const parcelIds = [...new Set(input.parcelIds)];
  const succeeded: string[] = [];
  const failed: Array<{ parcelId: string; message: string }> = [];
  for (const parcelId of parcelIds) {
    try {
      await redispatchRiderReturnSvc({
        parcelId,
        riderUserId: input.riderUserId,
        companyId: input.companyId,
        branchId: input.branchId,
        actorUserId: input.actorUserId,
      });
      succeeded.push(parcelId);
    } catch (error) {
      failed.push({
        parcelId,
        message: error instanceof Error ? error.message : 'Failed to redispatch parcel',
      });
    }
  }
  return { succeeded, failed };
}
