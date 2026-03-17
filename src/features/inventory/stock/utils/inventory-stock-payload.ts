import type {
  StockAdjustmentCreateInput,
  StockAdjustmentCreatePayload,
  StockMovementCreateInput,
  StockMovementCreatePayload,
  StockTransferCreateInput,
  StockTransferCreatePayload,
  StockTransferUpdateInput,
  StockTransferUpdatePayload,
} from '../types/inventory-stock.types';

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

const COMPLETED_STATUS = 2;

export function toUpdateStockTransferPayload(
  input: StockTransferUpdateInput,
  context: { completedBy?: string },
): StockTransferUpdatePayload {
  if (input.status === COMPLETED_STATUS && context.completedBy) {
    return { status: input.status, completedBy: context.completedBy };
  }
  return { status: input.status };
}
