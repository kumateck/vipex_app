import { ParcelHolderType, ParcelInternalTransferStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  createParcelInternalTransferItemsRepo,
  createParcelInternalTransferRepo,
  getLocationForTransferRepo,
  getParcelHolderSnapshotsRepo,
  getParcelInternalTransferRepo,
  getWarehouseForTransferRepo,
  listParcelInternalTransferItemsRepo,
  listParcelInternalTransfersRepo,
  listPendingTransferParcelIdsRepo,
  updateParcelInternalTransferRepo,
  upsertParcelInternalHolderRepo,
} from './repository';

type HolderInput = {
  holderType: number;
  locationId?: string | null;
  warehouseId?: string | null;
};

function normalizeHolder(input: HolderInput) {
  return {
    holderType: input.holderType,
    locationId: input.holderType === ParcelHolderType.LOCATION ? (input.locationId ?? null) : null,
    warehouseId:
      input.holderType === ParcelHolderType.WAREHOUSE ? (input.warehouseId ?? null) : null,
  };
}

function holderEquals(
  left: { holderType: number; locationId?: string | null; warehouseId?: string | null },
  right: { holderType: number; locationId?: string | null; warehouseId?: string | null },
) {
  return (
    left.holderType === right.holderType &&
    (left.locationId ?? null) === (right.locationId ?? null) &&
    (left.warehouseId ?? null) === (right.warehouseId ?? null)
  );
}

function generateReferenceNo() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(
    2,
    '0',
  )}${String(now.getSeconds()).padStart(2, '0')}`;
  return `PIT-${stamp}`;
}

async function assertHolderExists(
  companyId: string,
  branchId: string,
  input: { holderType: number; locationId?: string | null; warehouseId?: string | null },
  label: 'source' | 'destination',
) {
  if (input.holderType === ParcelHolderType.BRANCH) return;
  if (input.holderType === ParcelHolderType.LOCATION) {
    if (!input.locationId) throw BadRequest(`${label} location is required`);
    const location = await getLocationForTransferRepo(input.locationId);
    if (!location || location.isDeleted) throw NotFound(`${label} location not found`);
    if (location.companyId !== companyId || location.branchId !== branchId) {
      throw Conflict(`${label} location must belong to the same branch`);
    }
    return;
  }
  if (input.holderType === ParcelHolderType.WAREHOUSE) {
    if (!input.warehouseId) throw BadRequest(`${label} warehouse is required`);
    const warehouse = await getWarehouseForTransferRepo(input.warehouseId);
    if (!warehouse || warehouse.isDeleted) throw NotFound(`${label} warehouse not found`);
    if (warehouse.companyId !== companyId || warehouse.branchId !== branchId) {
      throw Conflict(`${label} warehouse must belong to the same branch`);
    }
    if (!warehouse.active) throw Conflict(`${label} warehouse is inactive`);
    return;
  }
  throw BadRequest(`Unsupported ${label} holder type`);
}

export async function listParcelInternalTransfersSvc(input: {
  companyId: string;
  branchId?: string | null;
  status?: number | null;
  destinationLocationId?: string | null;
  destinationWarehouseId?: string | null;
  sourceLocationId?: string | null;
  sourceWarehouseId?: string | null;
}) {
  return listParcelInternalTransfersRepo(input);
}

export async function getParcelInternalTransferDetailsSvc(id: string, companyId: string) {
  const transfer = await getParcelInternalTransferRepo(id, companyId);
  if (!transfer) throw NotFound('Parcel internal transfer not found');
  const items = await listParcelInternalTransferItemsRepo(id);
  return { transfer, items };
}

export async function createParcelInternalTransferSvc(input: {
  companyId: string;
  branchId: string;
  sourceHolderType: number;
  sourceLocationId?: string | null;
  sourceWarehouseId?: string | null;
  destinationHolderType: number;
  destinationLocationId?: string | null;
  destinationWarehouseId?: string | null;
  notes?: string | null;
  parcelIds: string[];
  transferredBy: string;
}) {
  const parcelIds = [...new Set(input.parcelIds.filter(Boolean))];
  if (parcelIds.length === 0) throw BadRequest('At least one parcel is required');

  const source = normalizeHolder({
    holderType: input.sourceHolderType,
    locationId: input.sourceLocationId,
    warehouseId: input.sourceWarehouseId,
  });
  const destination = normalizeHolder({
    holderType: input.destinationHolderType,
    locationId: input.destinationLocationId,
    warehouseId: input.destinationWarehouseId,
  });

  if (holderEquals(source, destination)) {
    throw Conflict('Source and destination holders must be different');
  }

  await assertHolderExists(input.companyId, input.branchId, source, 'source');
  await assertHolderExists(input.companyId, input.branchId, destination, 'destination');

  const snapshots = await getParcelHolderSnapshotsRepo(parcelIds);
  if (snapshots.length !== parcelIds.length) {
    throw NotFound('One or more parcels could not be found');
  }

  const pending = await listPendingTransferParcelIdsRepo(parcelIds);
  if (pending.length > 0) {
    throw Conflict('One or more selected parcels already have a pending internal transfer');
  }

  for (const snapshot of snapshots) {
    const currentHolder =
      snapshot.currentHolderType == null
        ? {
            holderType: ParcelHolderType.BRANCH,
            locationId: null,
            warehouseId: null,
          }
        : {
            holderType: snapshot.currentHolderType,
            locationId: snapshot.currentLocationId ?? null,
            warehouseId: snapshot.currentWarehouseId ?? null,
          };

    const currentBranchId = snapshot.currentBranchId ?? snapshot.destinationBranchId;
    if (snapshot.companyId !== input.companyId || currentBranchId !== input.branchId) {
      throw Conflict('All selected parcels must currently belong to the selected branch');
    }

    if (!holderEquals(currentHolder, source)) {
      throw Conflict(
        `Parcel ${snapshot.trackingCode} is not currently held at the selected source holder`,
      );
    }
  }

  return db.transaction(async (tx) => {
    const created = await createParcelInternalTransferRepo(
      {
        companyId: input.companyId,
        branchId: input.branchId,
        referenceNo: generateReferenceNo(),
        sourceHolderType: source.holderType,
        sourceLocationId: source.locationId,
        sourceWarehouseId: source.warehouseId,
        destinationHolderType: destination.holderType,
        destinationLocationId: destination.locationId,
        destinationWarehouseId: destination.warehouseId,
        notes: input.notes?.trim() || null,
        status: ParcelInternalTransferStatus.PENDING,
        transferredBy: input.transferredBy,
      },
      tx,
    );

    if (!created) throw NotFound('Failed to create internal transfer');

    await createParcelInternalTransferItemsRepo(
      parcelIds.map((parcelId) => ({ transferId: created.id, parcelId })),
      tx,
    );

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.transferredBy,
      entityType: 'parcel_internal_transfer',
      entityId: created.id,
      action: 'PARCEL_INTERNAL_TRANSFER_CREATED',
      message: 'Parcel internal transfer created',
      metadata: {
        branchId: input.branchId,
        source,
        destination,
        parcelIds,
      },
    });

    return { id: created.id };
  });
}

export async function acknowledgeParcelInternalTransferSvc(input: {
  id: string;
  companyId: string;
  acknowledgedBy: string;
}) {
  const transfer = await getParcelInternalTransferRepo(input.id, input.companyId);
  if (!transfer) throw NotFound('Parcel internal transfer not found');
  if (transfer.status !== ParcelInternalTransferStatus.PENDING) {
    throw Conflict('Only pending transfers can be acknowledged');
  }

  const items = await listParcelInternalTransferItemsRepo(input.id);
  if (items.length === 0) throw Conflict('Transfer has no parcels to acknowledge');

  await db.transaction(async (tx) => {
    for (const item of items) {
      await upsertParcelInternalHolderRepo(
        {
          parcelId: item.parcelId,
          companyId: transfer.companyId,
          branchId: transfer.branchId,
          holderType: transfer.destinationHolderType,
          locationId: transfer.destinationLocationId ?? null,
          warehouseId: transfer.destinationWarehouseId ?? null,
          updatedBy: input.acknowledgedBy,
        },
        tx,
      );
    }

    await updateParcelInternalTransferRepo(
      input.id,
      {
        status: ParcelInternalTransferStatus.ACKNOWLEDGED,
        acknowledgedBy: input.acknowledgedBy,
        acknowledgedAt: new Date(),
      },
      tx,
    );
  });

  await recordAuditLog({
    companyId: transfer.companyId,
    actorUserId: input.acknowledgedBy,
    entityType: 'parcel_internal_transfer',
    entityId: input.id,
    action: 'PARCEL_INTERNAL_TRANSFER_ACKNOWLEDGED',
    message: 'Parcel internal transfer acknowledged',
    metadata: {
      destinationHolderType: transfer.destinationHolderType,
      destinationLocationId: transfer.destinationLocationId,
      destinationWarehouseId: transfer.destinationWarehouseId,
      parcelCount: items.length,
    },
  });

  return { id: input.id };
}

export async function cancelParcelInternalTransferSvc(input: {
  id: string;
  companyId: string;
  cancelledBy: string;
  cancelReason: string;
}) {
  const transfer = await getParcelInternalTransferRepo(input.id, input.companyId);
  if (!transfer) throw NotFound('Parcel internal transfer not found');
  if (transfer.status !== ParcelInternalTransferStatus.PENDING) {
    throw Conflict('Only pending transfers can be cancelled');
  }
  if (!input.cancelReason.trim()) throw BadRequest('Cancel reason is required');

  await updateParcelInternalTransferRepo(input.id, {
    status: ParcelInternalTransferStatus.CANCELLED,
    cancelledBy: input.cancelledBy,
    cancelledAt: new Date(),
    cancelReason: input.cancelReason.trim(),
  });

  await recordAuditLog({
    companyId: transfer.companyId,
    actorUserId: input.cancelledBy,
    entityType: 'parcel_internal_transfer',
    entityId: input.id,
    action: 'PARCEL_INTERNAL_TRANSFER_CANCELLED',
    message: 'Parcel internal transfer cancelled',
    metadata: { cancelReason: input.cancelReason.trim() },
  });

  return { id: input.id };
}
