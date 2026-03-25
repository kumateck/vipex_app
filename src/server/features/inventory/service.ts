import { Conflict, NotFound, BadRequest } from '../../utils/http-error';
import { StockMovementType, TransferStatus } from '@/db/schemas/enums';
import {
  createProductCategoryRepo,
  listProductCategoryOptionsRepo,
  findProductCategoryByNameRepo,
  getProductCategoryRepo,
  listProductCategoriesRepo,
  softDeleteProductCategoryRepo,
  updateProductCategoryRepo,
  type ListProductCategoriesParams,
  createProductRepo,
  listProductOptionsRepo,
  findProductBySkuRepo,
  getProductRepo,
  listProductsRepo,
  softDeleteProductRepo,
  updateProductRepo,
  type ListProductsParams,
  createInventoryLocationRepo,
  listInventoryLocationOptionsRepo,
  findInventoryLocationByNameRepo,
  getInventoryLocationRepo,
  listInventoryLocationsRepo,
  softDeleteInventoryLocationRepo,
  updateInventoryLocationRepo,
  type ListInventoryLocationsParams,
  getStockLevelRepo,
  listStockLevelsRepo,
  upsertStockLevelRepo,
  type ListStockLevelsParams,
  createStockMovementRepo,
  listStockMovementsRepo,
  type ListStockMovementsParams,
  createStockAdjustmentRepo,
  listStockAdjustmentsRepo,
  type ListStockAdjustmentsParams,
  createStockTransferRepo,
  getStockTransferRepo,
  listStockTransfersRepo,
  updateStockTransferRepo,
  type ListStockTransfersParams,
  getLowStockProductsRepo,
  getMovementHistoryRepo,
  type MovementHistoryParams,
} from './repository';

// Product Categories
export async function listProductCategoriesSvc(p: ListProductCategoriesParams) {
  return listProductCategoriesRepo(p);
}
export async function listProductCategoryOptionsSvc(p: {
  companyId?: string | null;
  search?: string | null;
}) {
  return listProductCategoryOptionsRepo(p);
}

export async function getProductCategorySvc(id: string) {
  const category = await getProductCategoryRepo(id);
  if (!category) throw NotFound('Product category not found');
  return category;
}

export async function createProductCategorySvc(input: {
  companyId: string;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  const dup = await findProductCategoryByNameRepo(input.companyId, input.name);
  if (dup) throw Conflict('Product category name already exists for this company');
  const created = await createProductCategoryRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}

export async function updateProductCategorySvc(
  id: string,
  patch: { name?: string; description?: string | null },
) {
  if (patch.name) {
    const existing = await getProductCategoryRepo(id);
    if (!existing) throw NotFound('Product category not found');
    if (patch.name !== existing.name) {
      const dup = await findProductCategoryByNameRepo(existing.companyId, patch.name);
      if (dup && dup.id !== id)
        throw Conflict('Product category name already exists for this company');
    }
  }
  const updated = await updateProductCategoryRepo(id, patch);
  if (!updated) throw NotFound('Product category not found');
  return { id: updated.id };
}

export async function deleteProductCategorySvc(id: string) {
  const count = await softDeleteProductCategoryRepo(id);
  if (!count) throw NotFound('Product category not found or already deleted');
  return { success: true };
}

// Products
export async function listProductsSvc(p: ListProductsParams) {
  return listProductsRepo(p);
}
export async function listProductOptionsSvc(p: {
  companyId?: string | null;
  categoryId?: string | null;
  search?: string | null;
}) {
  return listProductOptionsRepo(p);
}

export async function getProductSvc(id: string) {
  const product = await getProductRepo(id);
  if (!product) throw NotFound('Product not found');
  return product;
}

export async function createProductSvc(input: {
  companyId: string;
  categoryId?: string | null;
  sku: string;
  name: string;
  description?: string | null;
  unitOfMeasure: number;
  minStockLevel?: number;
  createdBy: string;
}) {
  const dup = await findProductBySkuRepo(input.companyId, input.sku);
  if (dup) throw Conflict('Product SKU already exists for this company');
  const created = await createProductRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}

export async function updateProductSvc(
  id: string,
  patch: {
    categoryId?: string | null;
    name?: string;
    description?: string | null;
    unitOfMeasure?: number;
    minStockLevel?: number;
  },
) {
  const updated = await updateProductRepo(id, patch);
  if (!updated) throw NotFound('Product not found');
  return { id: updated.id };
}

export async function deleteProductSvc(id: string) {
  const count = await softDeleteProductRepo(id);
  if (!count) throw NotFound('Product not found or already deleted');
  return { success: true };
}

// Inventory Locations
export async function listInventoryLocationsSvc(p: ListInventoryLocationsParams) {
  return listInventoryLocationsRepo(p);
}
export async function listInventoryLocationOptionsSvc(p: {
  companyId?: string | null;
  branchId?: string | null;
  search?: string | null;
}) {
  return listInventoryLocationOptionsRepo(p);
}

export async function getInventoryLocationSvc(id: string) {
  const location = await getInventoryLocationRepo(id);
  if (!location) throw NotFound('Inventory location not found');
  return location;
}

export async function createInventoryLocationSvc(input: {
  companyId: string;
  branchId: string;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  const dup = await findInventoryLocationByNameRepo(input.branchId, input.name);
  if (dup) throw Conflict('Inventory location name already exists for this branch');
  const created = await createInventoryLocationRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}

export async function updateInventoryLocationSvc(
  id: string,
  patch: { name?: string; description?: string | null },
) {
  if (patch.name) {
    const existing = await getInventoryLocationRepo(id);
    if (!existing) throw NotFound('Inventory location not found');
    if (patch.name !== existing.name) {
      const dup = await findInventoryLocationByNameRepo(existing.branchId, patch.name);
      if (dup && dup.id !== id)
        throw Conflict('Inventory location name already exists for this branch');
    }
  }
  const updated = await updateInventoryLocationRepo(id, patch);
  if (!updated) throw NotFound('Inventory location not found');
  return { id: updated.id };
}

export async function deleteInventoryLocationSvc(id: string) {
  const count = await softDeleteInventoryLocationRepo(id);
  if (!count) throw NotFound('Inventory location not found or already deleted');
  return { success: true };
}

// Stock Levels
export async function listStockLevelsSvc(p: ListStockLevelsParams) {
  return listStockLevelsRepo(p);
}

export async function getStockLevelSvc(productId: string, locationId: string) {
  const level = await getStockLevelRepo(productId, locationId);
  if (!level) throw NotFound('Stock level not found');
  return level;
}

// Stock Movements
export async function listStockMovementsSvc(p: ListStockMovementsParams) {
  return listStockMovementsRepo(p);
}

export async function createStockMovementSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  movementType: number;
  quantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  // Validate product and location exist
  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const location = await getInventoryLocationRepo(input.locationId);
  if (!location) throw NotFound('Inventory location not found');

  // Create movement record
  const created = await createStockMovementRepo(input);

  // Update stock level based on movement type
  const currentLevel = await getStockLevelRepo(input.productId, input.locationId);
  let newQuantity = currentLevel?.quantity || 0;

  // Apply quantity changes based on movement type
  switch (input.movementType) {
    case StockMovementType.RECEIPT:
    case StockMovementType.TRANSFER_IN:
      newQuantity += input.quantity;
      break;
    case StockMovementType.ISSUE:
    case StockMovementType.TRANSFER_OUT:
      newQuantity -= input.quantity;
      if (newQuantity < 0) throw BadRequest('Insufficient stock for this operation');
      break;
    case StockMovementType.ADJUSTMENT:
      // For adjustments, quantity can be positive or negative
      newQuantity = input.quantity;
      break;
  }

  // Upsert stock level
  await upsertStockLevelRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    quantity: newQuantity,
  });

  return { id: created?.id };
}

// Stock Adjustments (with automatic movement recording)
export async function listStockAdjustmentsSvc(p: ListStockAdjustmentsParams) {
  return listStockAdjustmentsRepo(p);
}

export async function createStockAdjustmentSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  reason: number;
  quantityChange: number;
  notes?: string | null;
  createdBy: string;
}) {
  // Validate product and location exist
  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const location = await getInventoryLocationRepo(input.locationId);
  if (!location) throw NotFound('Inventory location not found');

  // Get current stock level
  const currentLevel = await getStockLevelRepo(input.productId, input.locationId);
  const currentQty = currentLevel?.quantity || 0;
  const newQuantity = currentQty + input.quantityChange;

  if (newQuantity < 0) throw BadRequest('Adjustment would result in negative stock');

  // Create adjustment record
  const created = await createStockAdjustmentRepo(input);

  // Create stock movement
  await createStockMovementRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    movementType: StockMovementType.ADJUSTMENT,
    quantity: newQuantity,
    referenceId: created?.id,
    referenceType: 'adjustment',
    notes: input.notes,
    createdBy: input.createdBy,
  });

  // Update stock level
  await upsertStockLevelRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    quantity: newQuantity,
  });

  return { id: created?.id };
}

// Stock Transfers
export async function listStockTransfersSvc(p: ListStockTransfersParams) {
  return listStockTransfersRepo(p);
}

export async function getStockTransferSvc(id: string) {
  const transfer = await getStockTransferRepo(id);
  if (!transfer) throw NotFound('Stock transfer not found');
  return transfer;
}

export async function createStockTransferSvc(input: {
  companyId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  notes?: string | null;
  createdBy: string;
}) {
  if (input.fromLocationId === input.toLocationId)
    throw BadRequest('Source and destination locations must be different');

  // Validate product and locations exist
  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const fromLocation = await getInventoryLocationRepo(input.fromLocationId);
  if (!fromLocation) throw NotFound('Source location not found');
  const toLocation = await getInventoryLocationRepo(input.toLocationId);
  if (!toLocation) throw NotFound('Destination location not found');

  // Check if sufficient stock exists at source
  const sourceLevel = await getStockLevelRepo(input.productId, input.fromLocationId);
  if (!sourceLevel || sourceLevel.quantity < input.quantity)
    throw BadRequest('Insufficient stock at source location');

  const created = await createStockTransferRepo(input);
  return { id: created?.id };
}

export async function updateStockTransferSvc(
  id: string,
  patch: { status: number; completedBy?: string },
) {
  const transfer = await getStockTransferRepo(id);
  if (!transfer) throw NotFound('Stock transfer not found');

  // Handle transfer completion
  if (patch.status === TransferStatus.COMPLETED) {
    // Create transfer-out movement
    await createStockMovementRepo({
      companyId: transfer.companyId,
      productId: transfer.productId,
      locationId: transfer.fromLocationId,
      movementType: StockMovementType.TRANSFER_OUT,
      quantity: transfer.quantity,
      referenceId: id,
      referenceType: 'transfer',
      notes: transfer.notes,
      createdBy: patch.completedBy || transfer.createdBy,
    });

    // Create transfer-in movement
    await createStockMovementRepo({
      companyId: transfer.companyId,
      productId: transfer.productId,
      locationId: transfer.toLocationId,
      movementType: StockMovementType.TRANSFER_IN,
      quantity: transfer.quantity,
      referenceId: id,
      referenceType: 'transfer',
      notes: transfer.notes,
      createdBy: patch.completedBy || transfer.createdBy,
    });

    // Update transfer record
    const updated = await updateStockTransferRepo(id, {
      ...patch,
      completedAt: new Date(),
    });

    return { id: updated?.id };
  }

  const updated = await updateStockTransferRepo(id, patch);
  return { id: updated?.id };
}

// Reports
export async function getLowStockReportSvc(filters: {
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
}) {
  return getLowStockProductsRepo(filters);
}

export async function getMovementHistorySvc(p: MovementHistoryParams) {
  return getMovementHistoryRepo(p);
}
