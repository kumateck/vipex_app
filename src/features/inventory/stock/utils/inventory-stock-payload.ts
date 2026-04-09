import type {
  StockMaintenanceCreateInput,
  StockMaintenanceCreatePayload,
  StockMaintenanceResolveInput,
  StockMaintenanceResolvePayload,
  StockRequestCreateInput,
  StockRequestCreatePayload,
  StockRequestFulfillLineInput,
  StockRequestFulfillLinePayload,
  StockRequestRejectInput,
  StockRequestRejectPayload,
  StockAdjustmentCreateInput,
  StockAdjustmentCreatePayload,
  StockMovementCreateInput,
  StockMovementCreatePayload,
  StockTransferCreateInput,
  StockTransferCreatePayload,
  StockTransferUpdateInput,
  StockTransferUpdatePayload,
  StockLotCreateInput,
} from '../types/inventory-stock.types';
import { TransferStatus } from '@/db/schemas/enums';

const toOptional = (value?: string | null) => (value?.trim() ? value.trim() : undefined);

export function toCreateStockMovementPayload(
  input: StockMovementCreateInput,
  context: { companyId: string; createdBy: string },
): StockMovementCreatePayload {
  return {
    companyId: context.companyId,
    createdBy: context.createdBy,
    productId: input.productId.trim(),
    locationId: input.locationId.trim(),
    movementType: input.movementType,
    quantity: input.quantity.trim(),
    ...(toOptional(input.batchNumber) ? { batchNumber: toOptional(input.batchNumber) } : {}),
    ...(toOptional(input.sourceLotId) ? { sourceLotId: toOptional(input.sourceLotId) } : {}),
    ...(toOptional(input.supplierBatchNumber)
      ? { supplierBatchNumber: toOptional(input.supplierBatchNumber) }
      : {}),
    ...(toOptional(input.expiryDate) ? { expiryDate: toOptional(input.expiryDate) } : {}),
    ...(toOptional(input.manufacturedAt)
      ? { manufacturedAt: toOptional(input.manufacturedAt) }
      : {}),
    ...(toOptional(input.receivedAt) ? { receivedAt: toOptional(input.receivedAt) } : {}),
    ...(toOptional(input.referenceId) ? { referenceId: toOptional(input.referenceId) } : {}),
    ...(toOptional(input.referenceType) ? { referenceType: toOptional(input.referenceType) } : {}),
    ...(toOptional(input.notes) ? { notes: toOptional(input.notes) } : {}),
  };
}

export function toCreateStockAdjustmentPayload(
  input: StockAdjustmentCreateInput,
  context: { companyId: string; createdBy: string },
): StockAdjustmentCreatePayload {
  return {
    companyId: context.companyId,
    createdBy: context.createdBy,
    productId: input.productId.trim(),
    locationId: input.locationId.trim(),
    reason: input.reason,
    quantityChange: input.quantityChange.trim(),
    ...(toOptional(input.batchNumber) ? { batchNumber: toOptional(input.batchNumber) } : {}),
    ...(toOptional(input.sourceLotId) ? { sourceLotId: toOptional(input.sourceLotId) } : {}),
    ...(toOptional(input.supplierBatchNumber)
      ? { supplierBatchNumber: toOptional(input.supplierBatchNumber) }
      : {}),
    ...(toOptional(input.expiryDate) ? { expiryDate: toOptional(input.expiryDate) } : {}),
    ...(toOptional(input.manufacturedAt)
      ? { manufacturedAt: toOptional(input.manufacturedAt) }
      : {}),
    ...(toOptional(input.notes) ? { notes: toOptional(input.notes) } : {}),
  };
}

export function toCreateStockLotPayload(
  input: StockLotCreateInput,
  context: { companyId: string; createdBy: string },
) {
  return {
    companyId: context.companyId,
    createdBy: context.createdBy,
    productId: input.productId.trim(),
    locationId: input.locationId.trim(),
    batchNumber: input.batchNumber.trim(),
    quantityOnHand: input.quantityOnHand.trim(),
    ...(toOptional(input.supplierBatchNumber)
      ? { supplierBatchNumber: toOptional(input.supplierBatchNumber) }
      : {}),
    ...(toOptional(input.expiryDate) ? { expiryDate: toOptional(input.expiryDate) } : {}),
    ...(toOptional(input.manufacturedAt)
      ? { manufacturedAt: toOptional(input.manufacturedAt) }
      : {}),
    ...(toOptional(input.receivedAt) ? { receivedAt: toOptional(input.receivedAt) } : {}),
    ...(toOptional(input.notes) ? { notes: toOptional(input.notes) } : {}),
  };
}

export function toCreateStockTransferPayload(
  input: StockTransferCreateInput,
  context: { companyId: string; createdBy: string },
): StockTransferCreatePayload {
  return {
    companyId: context.companyId,
    createdBy: context.createdBy,
    productId: input.productId.trim(),
    fromLocationId: input.fromLocationId.trim(),
    toLocationId: input.toLocationId.trim(),
    quantity: input.quantity.trim(),
    ...(toOptional(input.notes) ? { notes: toOptional(input.notes) } : {}),
  };
}

export function toUpdateStockTransferPayload(
  input: StockTransferUpdateInput,
  context: { completedBy?: string },
): StockTransferUpdatePayload {
  const payload: StockTransferUpdatePayload = {
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(toOptional(input.fulfillQuantity)
      ? { fulfillQuantity: toOptional(input.fulfillQuantity) }
      : {}),
  };

  if (input.status === TransferStatus.COMPLETED && context.completedBy) {
    payload.completedBy = context.completedBy;
  }

  return payload;
}

export function toCreateStockRequestPayload(
  input: StockRequestCreateInput,
  context: { companyId: string; requestedBy: string },
): StockRequestCreatePayload {
  return {
    companyId: context.companyId,
    requestedBy: context.requestedBy,
    requesterLocationId: input.requesterLocationId.trim(),
    ...(toOptional(input.requestedToLocationId)
      ? { requestedToLocationId: toOptional(input.requestedToLocationId) }
      : {}),
    ...(toOptional(input.notes) ? { notes: toOptional(input.notes) } : {}),
    ...(input.submit !== undefined ? { submit: input.submit } : {}),
    lines: input.lines.map((line) => ({
      productId: line.productId.trim(),
      requestedQuantity: line.requestedQuantity.trim(),
      ...(toOptional(line.notes) ? { notes: toOptional(line.notes) } : {}),
    })),
  };
}

export function toRejectStockRequestPayload(
  input: StockRequestRejectInput,
  context: { rejectedBy: string },
): StockRequestRejectPayload {
  return {
    rejectedBy: context.rejectedBy,
    ...(toOptional(input.reason) ? { reason: toOptional(input.reason) } : {}),
  };
}

export function toFulfillStockRequestLinePayload(
  input: StockRequestFulfillLineInput,
  context: { fulfilledBy: string },
): StockRequestFulfillLinePayload {
  return {
    lineId: input.lineId.trim(),
    fromLocationId: input.fromLocationId.trim(),
    fulfillQuantity: input.fulfillQuantity.trim(),
    fulfilledBy: context.fulfilledBy,
    ...(toOptional(input.notes) ? { notes: toOptional(input.notes) } : {}),
  };
}

export function toCreateStockMaintenancePayload(
  input: StockMaintenanceCreateInput,
  context: { companyId: string; createdBy: string },
): StockMaintenanceCreatePayload {
  return {
    companyId: context.companyId,
    createdBy: context.createdBy,
    productId: input.productId.trim(),
    locationId: input.locationId.trim(),
    issueType: input.issueType,
    quantity: input.quantity.trim(),
    ...(toOptional(input.notes) ? { notes: toOptional(input.notes) } : {}),
  };
}

export function toResolveStockMaintenancePayload(
  input: StockMaintenanceResolveInput,
  context: { resolvedBy: string },
): StockMaintenanceResolvePayload {
  return {
    resolvedBy: context.resolvedBy,
    ...(toOptional(input.quantityReturned)
      ? { quantityReturned: toOptional(input.quantityReturned) }
      : {}),
    ...(toOptional(input.quantityDisposed)
      ? { quantityDisposed: toOptional(input.quantityDisposed) }
      : {}),
    ...(toOptional(input.notes) ? { notes: toOptional(input.notes) } : {}),
  };
}
