import { and, asc, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  branches,
  locations,
  parcels,
  parcelInternalHolders,
  parcelInternalTransferItems,
  parcelInternalTransfers,
  users,
  warehouses,
} from '@/db/schemas';
import { ParcelInternalTransferStatus } from '@/db/schemas/enums';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function getLocationForTransferRepo(id: string) {
  const [row] = await db
    .select({
      id: locations.id,
      companyId: locations.companyId,
      branchId: locations.branchId,
      name: locations.name,
      isDeleted: locations.isDeleted,
    })
    .from(locations)
    .where(eq(locations.id, id))
    .limit(1);
  return row ?? null;
}

export async function getWarehouseForTransferRepo(id: string) {
  const [row] = await db
    .select({
      id: warehouses.id,
      companyId: warehouses.companyId,
      branchId: warehouses.branchId,
      name: warehouses.name,
      active: warehouses.active,
      isDeleted: warehouses.isDeleted,
    })
    .from(warehouses)
    .where(eq(warehouses.id, id))
    .limit(1);
  return row ?? null;
}

export async function getParcelInternalHolderByParcelRepo(parcelId: string) {
  const [branch, location, warehouse] = [branches, locations, warehouses];

  const [row] = await db
    .select({
      parcelId: parcelInternalHolders.parcelId,
      holderType: parcelInternalHolders.holderType,
      branchId: parcelInternalHolders.branchId,
      branchName: branch.name,
      locationId: parcelInternalHolders.locationId,
      locationName: location.name,
      warehouseId: parcelInternalHolders.warehouseId,
      warehouseName: warehouse.name,
      updatedAt: parcelInternalHolders.updatedAt,
    })
    .from(parcelInternalHolders)
    .leftJoin(branch, eq(branch.id, parcelInternalHolders.branchId))
    .leftJoin(location, eq(location.id, parcelInternalHolders.locationId))
    .leftJoin(warehouse, eq(warehouse.id, parcelInternalHolders.warehouseId))
    .where(eq(parcelInternalHolders.parcelId, parcelId))
    .limit(1);

  return row ?? null;
}

export async function getParcelHolderSnapshotsRepo(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];
  const [destinationBranch, currentBranch] = [branches, branches];

  return db
    .select({
      parcelId: parcels.id,
      companyId: parcels.companyId,
      destinationBranchId: parcels.destinationId,
      destinationBranchName: destinationBranch.name,
      currentHolderType: parcelInternalHolders.holderType,
      currentBranchId: parcelInternalHolders.branchId,
      currentBranchName: currentBranch.name,
      currentLocationId: parcelInternalHolders.locationId,
      currentWarehouseId: parcelInternalHolders.warehouseId,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      parcelDetails: parcels.parcelDetails,
      receiverId: parcels.receiverId,
    })
    .from(parcels)
    .leftJoin(parcelInternalHolders, eq(parcelInternalHolders.parcelId, parcels.id))
    .leftJoin(destinationBranch, eq(destinationBranch.id, parcels.destinationId))
    .leftJoin(currentBranch, eq(currentBranch.id, parcelInternalHolders.branchId))
    .where(inArray(parcels.id, parcelIds));
}

export async function listPendingTransferParcelIdsRepo(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];
  return db
    .select({
      parcelId: parcelInternalTransferItems.parcelId,
      transferId: parcelInternalTransferItems.transferId,
    })
    .from(parcelInternalTransferItems)
    .innerJoin(
      parcelInternalTransfers,
      eq(parcelInternalTransfers.id, parcelInternalTransferItems.transferId),
    )
    .where(
      and(
        inArray(parcelInternalTransferItems.parcelId, parcelIds),
        eq(parcelInternalTransfers.status, ParcelInternalTransferStatus.PENDING),
      ),
    );
}

export async function createParcelInternalTransferRepo(
  values: typeof parcelInternalTransfers.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(parcelInternalTransfers)
    .values(values)
    .returning({ id: parcelInternalTransfers.id });
  return row ?? null;
}

export async function createParcelInternalTransferItemsRepo(
  values: Array<typeof parcelInternalTransferItems.$inferInsert>,
  executor: DbExecutor = db,
) {
  return executor.insert(parcelInternalTransferItems).values(values);
}

export async function getParcelInternalTransferRepo(id: string, companyId?: string | null) {
  const [sourceBranch, transferredByUser, acknowledgedByUser, sourceLocation, sourceWarehouse] = [
    branches,
    users,
    users,
    locations,
    warehouses,
  ];
  const [destinationLocation, destinationWarehouse] = [locations, warehouses];

  const where = [eq(parcelInternalTransfers.id, id)];
  if (companyId) where.push(eq(parcelInternalTransfers.companyId, companyId));

  const [row] = await db
    .select({
      id: parcelInternalTransfers.id,
      companyId: parcelInternalTransfers.companyId,
      branchId: parcelInternalTransfers.branchId,
      branchName: sourceBranch.name,
      referenceNo: parcelInternalTransfers.referenceNo,
      sourceHolderType: parcelInternalTransfers.sourceHolderType,
      sourceLocationId: parcelInternalTransfers.sourceLocationId,
      sourceLocationName: sourceLocation.name,
      sourceWarehouseId: parcelInternalTransfers.sourceWarehouseId,
      sourceWarehouseName: sourceWarehouse.name,
      destinationHolderType: parcelInternalTransfers.destinationHolderType,
      destinationLocationId: parcelInternalTransfers.destinationLocationId,
      destinationLocationName: destinationLocation.name,
      destinationWarehouseId: parcelInternalTransfers.destinationWarehouseId,
      destinationWarehouseName: destinationWarehouse.name,
      notes: parcelInternalTransfers.notes,
      status: parcelInternalTransfers.status,
      transferredBy: parcelInternalTransfers.transferredBy,
      transferredByName: transferredByUser.fullname,
      transferredAt: parcelInternalTransfers.transferredAt,
      acknowledgedBy: parcelInternalTransfers.acknowledgedBy,
      acknowledgedByName: acknowledgedByUser.fullname,
      acknowledgedAt: parcelInternalTransfers.acknowledgedAt,
      cancelledBy: parcelInternalTransfers.cancelledBy,
      cancelledAt: parcelInternalTransfers.cancelledAt,
      cancelReason: parcelInternalTransfers.cancelReason,
      createdAt: parcelInternalTransfers.createdAt,
      updatedAt: parcelInternalTransfers.updatedAt,
    })
    .from(parcelInternalTransfers)
    .leftJoin(sourceBranch, eq(sourceBranch.id, parcelInternalTransfers.branchId))
    .leftJoin(sourceLocation, eq(sourceLocation.id, parcelInternalTransfers.sourceLocationId))
    .leftJoin(sourceWarehouse, eq(sourceWarehouse.id, parcelInternalTransfers.sourceWarehouseId))
    .leftJoin(
      destinationLocation,
      eq(destinationLocation.id, parcelInternalTransfers.destinationLocationId),
    )
    .leftJoin(
      destinationWarehouse,
      eq(destinationWarehouse.id, parcelInternalTransfers.destinationWarehouseId),
    )
    .leftJoin(transferredByUser, eq(transferredByUser.id, parcelInternalTransfers.transferredBy))
    .leftJoin(acknowledgedByUser, eq(acknowledgedByUser.id, parcelInternalTransfers.acknowledgedBy))
    .where(and(...where))
    .limit(1);

  return row ?? null;
}

export async function listParcelInternalTransfersRepo(input: {
  companyId: string;
  branchId?: string | null;
  status?: number | null;
  destinationLocationId?: string | null;
  destinationWarehouseId?: string | null;
  sourceLocationId?: string | null;
  sourceWarehouseId?: string | null;
}) {
  const [branch, sourceLocation, sourceWarehouse] = [branches, locations, warehouses];
  const [destinationLocation, destinationWarehouse, transferredByUser] = [
    locations,
    warehouses,
    users,
  ];

  const where = [eq(parcelInternalTransfers.companyId, input.companyId)];
  if (input.branchId) where.push(eq(parcelInternalTransfers.branchId, input.branchId));
  if (input.status != null) where.push(eq(parcelInternalTransfers.status, input.status));
  if (input.destinationLocationId) {
    where.push(eq(parcelInternalTransfers.destinationLocationId, input.destinationLocationId));
  }
  if (input.destinationWarehouseId) {
    where.push(eq(parcelInternalTransfers.destinationWarehouseId, input.destinationWarehouseId));
  }
  if (input.sourceLocationId) {
    where.push(eq(parcelInternalTransfers.sourceLocationId, input.sourceLocationId));
  }
  if (input.sourceWarehouseId) {
    where.push(eq(parcelInternalTransfers.sourceWarehouseId, input.sourceWarehouseId));
  }

  const rows = await db
    .select({
      id: parcelInternalTransfers.id,
      companyId: parcelInternalTransfers.companyId,
      branchId: parcelInternalTransfers.branchId,
      branchName: branch.name,
      referenceNo: parcelInternalTransfers.referenceNo,
      sourceHolderType: parcelInternalTransfers.sourceHolderType,
      sourceLocationId: parcelInternalTransfers.sourceLocationId,
      sourceLocationName: sourceLocation.name,
      sourceWarehouseId: parcelInternalTransfers.sourceWarehouseId,
      sourceWarehouseName: sourceWarehouse.name,
      destinationHolderType: parcelInternalTransfers.destinationHolderType,
      destinationLocationId: parcelInternalTransfers.destinationLocationId,
      destinationLocationName: destinationLocation.name,
      destinationWarehouseId: parcelInternalTransfers.destinationWarehouseId,
      destinationWarehouseName: destinationWarehouse.name,
      notes: parcelInternalTransfers.notes,
      status: parcelInternalTransfers.status,
      transferredBy: parcelInternalTransfers.transferredBy,
      transferredByName: transferredByUser.fullname,
      transferredAt: parcelInternalTransfers.transferredAt,
      acknowledgedBy: parcelInternalTransfers.acknowledgedBy,
      acknowledgedAt: parcelInternalTransfers.acknowledgedAt,
      itemParcelId: parcelInternalTransferItems.parcelId,
      createdAt: parcelInternalTransfers.createdAt,
      updatedAt: parcelInternalTransfers.updatedAt,
    })
    .from(parcelInternalTransfers)
    .leftJoin(branch, eq(branch.id, parcelInternalTransfers.branchId))
    .leftJoin(sourceLocation, eq(sourceLocation.id, parcelInternalTransfers.sourceLocationId))
    .leftJoin(sourceWarehouse, eq(sourceWarehouse.id, parcelInternalTransfers.sourceWarehouseId))
    .leftJoin(
      destinationLocation,
      eq(destinationLocation.id, parcelInternalTransfers.destinationLocationId),
    )
    .leftJoin(
      destinationWarehouse,
      eq(destinationWarehouse.id, parcelInternalTransfers.destinationWarehouseId),
    )
    .leftJoin(transferredByUser, eq(transferredByUser.id, parcelInternalTransfers.transferredBy))
    .leftJoin(
      parcelInternalTransferItems,
      eq(parcelInternalTransferItems.transferId, parcelInternalTransfers.id),
    )
    .where(and(...where))
    .orderBy(desc(parcelInternalTransfers.transferredAt), desc(parcelInternalTransfers.id));

  const grouped = new Map<string, (typeof rows)[number] & { itemCount: number }>();
  for (const row of rows) {
    const existing = grouped.get(row.id);
    if (existing) {
      existing.itemCount += row.itemParcelId ? 1 : 0;
    } else {
      grouped.set(row.id, { ...row, itemCount: row.itemParcelId ? 1 : 0 });
    }
  }

  return [...grouped.values()];
}

export async function listParcelInternalTransferItemsRepo(transferId: string) {
  const [receiver] = [users];
  return db
    .select({
      parcelId: parcelInternalTransferItems.parcelId,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      parcelDetails: parcels.parcelDetails,
      receiverId: parcels.receiverId,
      receiverName: receiver.fullname,
      receiverPhone: receiver.telephone,
      status: parcels.status,
      addedAt: parcelInternalTransferItems.addedAt,
    })
    .from(parcelInternalTransferItems)
    .innerJoin(parcels, eq(parcels.id, parcelInternalTransferItems.parcelId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(eq(parcelInternalTransferItems.transferId, transferId))
    .orderBy(asc(parcelInternalTransferItems.addedAt), asc(parcelInternalTransferItems.parcelId));
}

export async function updateParcelInternalTransferRepo(
  id: string,
  patch: Partial<typeof parcelInternalTransfers.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(parcelInternalTransfers)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(parcelInternalTransfers.id, id))
    .returning({ id: parcelInternalTransfers.id });

  return row ?? null;
}

export async function upsertParcelInternalHolderRepo(
  value: typeof parcelInternalHolders.$inferInsert,
  executor: DbExecutor = db,
) {
  await executor
    .insert(parcelInternalHolders)
    .values(value)
    .onConflictDoUpdate({
      target: parcelInternalHolders.parcelId,
      set: {
        companyId: value.companyId,
        branchId: value.branchId,
        holderType: value.holderType,
        locationId: value.locationId ?? null,
        warehouseId: value.warehouseId ?? null,
        updatedBy: value.updatedBy,
        updatedAt: new Date(),
      },
    });
}
