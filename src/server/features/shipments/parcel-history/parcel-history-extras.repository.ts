import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  locations,
  parcelDiscrepancies,
  parcelDispositionActions,
  parcelInternalTransferItems,
  parcelInternalTransfers,
  parcelReceiverOtps,
  parcelReconciliationCases,
  parcelStickerPrints,
  parcelStorageClearanceRequests,
  parcelStorageWaivers,
  pickupQueues,
  warehouses,
} from '@/db/schemas';

export function listParcelPickupQueueEventsRepo(parcelId: string) {
  return db.select().from(pickupQueues).where(eq(pickupQueues.parcelId, parcelId));
}

export function listParcelTransferEventsRepo(parcelId: string) {
  const fromLocation = alias(locations, 'history_from_location');
  const toLocation = alias(locations, 'history_to_location');
  const fromWarehouse = alias(warehouses, 'history_from_warehouse');
  const toWarehouse = alias(warehouses, 'history_to_warehouse');
  return db
    .select({
      id: parcelInternalTransfers.id,
      branchId: parcelInternalTransfers.branchId,
      referenceNo: parcelInternalTransfers.referenceNo,
      fromName: fromLocation.name,
      fromWarehouseName: fromWarehouse.name,
      toName: toLocation.name,
      toWarehouseName: toWarehouse.name,
      notes: parcelInternalTransfers.notes,
      transferredBy: parcelInternalTransfers.transferredBy,
      transferredAt: parcelInternalTransfers.transferredAt,
      acknowledgedBy: parcelInternalTransfers.acknowledgedBy,
      acknowledgedAt: parcelInternalTransfers.acknowledgedAt,
      cancelledBy: parcelInternalTransfers.cancelledBy,
      cancelledAt: parcelInternalTransfers.cancelledAt,
      cancelReason: parcelInternalTransfers.cancelReason,
    })
    .from(parcelInternalTransferItems)
    .innerJoin(
      parcelInternalTransfers,
      eq(parcelInternalTransfers.id, parcelInternalTransferItems.transferId),
    )
    .leftJoin(fromLocation, eq(fromLocation.id, parcelInternalTransfers.sourceLocationId))
    .leftJoin(toLocation, eq(toLocation.id, parcelInternalTransfers.destinationLocationId))
    .leftJoin(fromWarehouse, eq(fromWarehouse.id, parcelInternalTransfers.sourceWarehouseId))
    .leftJoin(toWarehouse, eq(toWarehouse.id, parcelInternalTransfers.destinationWarehouseId))
    .where(eq(parcelInternalTransferItems.parcelId, parcelId));
}

export function listParcelOtpEventsRepo(parcelId: string) {
  return db
    .select({
      id: parcelReceiverOtps.id,
      branchId: parcelReceiverOtps.branchId,
      targetReceiver: parcelReceiverOtps.targetReceiver,
      phone: parcelReceiverOtps.phone,
      createdBy: parcelReceiverOtps.createdBy,
      createdAt: parcelReceiverOtps.createdAt,
      verifiedAt: parcelReceiverOtps.verifiedAt,
    })
    .from(parcelReceiverOtps)
    .where(eq(parcelReceiverOtps.parcelId, parcelId));
}

export function listParcelStickerPrintEventsRepo(parcelId: string) {
  return db.select().from(parcelStickerPrints).where(eq(parcelStickerPrints.parcelId, parcelId));
}

export function listParcelDiscrepancyEventsRepo(parcelId: string) {
  return db.select().from(parcelDiscrepancies).where(eq(parcelDiscrepancies.parcelId, parcelId));
}

export function listParcelReconciliationEventsRepo(parcelId: string) {
  return db
    .select()
    .from(parcelReconciliationCases)
    .where(eq(parcelReconciliationCases.parcelId, parcelId));
}

export function listParcelStorageWaiverEventsRepo(parcelId: string) {
  return db.select().from(parcelStorageWaivers).where(eq(parcelStorageWaivers.parcelId, parcelId));
}

export function listParcelClearanceEventsRepo(parcelId: string) {
  return db
    .select()
    .from(parcelStorageClearanceRequests)
    .where(eq(parcelStorageClearanceRequests.parcelId, parcelId));
}

export function listParcelDispositionEventsRepo(parcelId: string) {
  return db
    .select({
      id: parcelDispositionActions.id,
      actionType: parcelDispositionActions.actionType,
      notes: parcelDispositionActions.notes,
      recoveredAmountPsw: parcelDispositionActions.recoveredAmountPsw,
      performedBy: parcelDispositionActions.performedBy,
      performedAt: parcelDispositionActions.performedAt,
      warehouseName: warehouses.name,
    })
    .from(parcelDispositionActions)
    .leftJoin(warehouses, eq(warehouses.id, parcelDispositionActions.warehouseId))
    .where(eq(parcelDispositionActions.parcelId, parcelId));
}
