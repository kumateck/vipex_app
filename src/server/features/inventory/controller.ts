import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import {
  listProductCategoriesSvc,
  getProductCategorySvc,
  createProductCategorySvc,
  updateProductCategorySvc,
  deleteProductCategorySvc,
  listProductsSvc,
  getProductSvc,
  createProductSvc,
  updateProductSvc,
  deleteProductSvc,
  listInventoryLocationsSvc,
  getInventoryLocationSvc,
  createInventoryLocationSvc,
  updateInventoryLocationSvc,
  deleteInventoryLocationSvc,
  listStockLevelsSvc,
  getStockLevelSvc,
  listStockMovementsSvc,
  createStockMovementSvc,
  listStockAdjustmentsSvc,
  createStockAdjustmentSvc,
  listStockTransfersSvc,
  getStockTransferSvc,
  createStockTransferSvc,
  updateStockTransferSvc,
  getLowStockReportSvc,
  getMovementHistorySvc,
} from './service';

// Product Categories
export async function listProductCategoriesCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listProductCategoriesSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
  });

  return {
    data: data.map((c) => ({
      ...c,
      createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
      updatedAt: c.updatedAt?.toISOString?.() ?? c.updatedAt,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getProductCategoryCtrl(id: string) {
  return getProductCategorySvc(id);
}

export async function createProductCategoryCtrl(input: {
  companyId: string;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  return createProductCategorySvc(input);
}

export async function updateProductCategoryCtrl(
  id: string,
  patch: { name?: string; description?: string | null },
) {
  return updateProductCategorySvc(id, patch);
}

export async function deleteProductCategoryCtrl(id: string) {
  return deleteProductCategorySvc(id);
}

// Products
export async function listProductsCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  categoryId?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listProductsSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    categoryId: q.categoryId ?? null,
  });

  return {
    data: data.map((p) => ({
      ...p,
      minStockLevel: p.minStockLevel.toString(),
      createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
      updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getProductCtrl(id: string) {
  const product = await getProductSvc(id);
  return {
    ...product,
    minStockLevel: product.minStockLevel.toString(),
  };
}

export async function createProductCtrl(input: {
  companyId: string;
  categoryId?: string | null;
  sku: string;
  name: string;
  description?: string | null;
  unitOfMeasure: number;
  minStockLevel?: string;
  createdBy: string;
}) {
  return createProductSvc({
    ...input,
    minStockLevel: input.minStockLevel ? parseFloat(input.minStockLevel) : undefined,
  });
}

export async function updateProductCtrl(
  id: string,
  patch: {
    categoryId?: string | null;
    name?: string;
    description?: string | null;
    unitOfMeasure?: number;
    minStockLevel?: string;
  },
) {
  return updateProductSvc(id, {
    ...patch,
    minStockLevel: patch.minStockLevel ? parseFloat(patch.minStockLevel) : undefined,
  });
}

export async function deleteProductCtrl(id: string) {
  return deleteProductSvc(id);
}

// Inventory Locations
export async function listInventoryLocationsCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  branchId?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listInventoryLocationsSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    branchId: q.branchId ?? null,
  });

  return {
    data: data.map((l) => ({
      ...l,
      createdAt: l.createdAt?.toISOString?.() ?? l.createdAt,
      updatedAt: l.updatedAt?.toISOString?.() ?? l.updatedAt,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getInventoryLocationCtrl(id: string) {
  return getInventoryLocationSvc(id);
}

export async function createInventoryLocationCtrl(input: {
  companyId: string;
  branchId: string;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  return createInventoryLocationSvc(input);
}

export async function updateInventoryLocationCtrl(
  id: string,
  patch: { name?: string; description?: string | null },
) {
  return updateInventoryLocationSvc(id, patch);
}

export async function deleteInventoryLocationCtrl(id: string) {
  return deleteInventoryLocationSvc(id);
}

// Stock Levels
export async function listStockLevelsCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ updatedAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listStockLevelsSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    productId: q.productId ?? null,
    locationId: q.locationId ?? null,
  });

  return {
    data: data.map((l) => ({
      ...l,
      quantity: l.quantity.toString(),
      updatedAt: l.updatedAt?.toISOString?.() ?? l.updatedAt,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getStockLevelCtrl(productId: string, locationId: string) {
  const level = await getStockLevelSvc(productId, locationId);
  return {
    ...level,
    quantity: level.quantity.toString(),
  };
}

// Stock Movements
export async function listStockMovementsCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
  movementType?: number | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listStockMovementsSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    productId: q.productId ?? null,
    locationId: q.locationId ?? null,
    movementType: q.movementType ?? null,
  });

  return {
    data: data.map((m) => ({
      ...m,
      quantity: m.quantity.toString(),
      createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function createStockMovementCtrl(input: {
  companyId: string;
  productId: string;
  locationId: string;
  movementType: number;
  quantity: string;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  return createStockMovementSvc({
    ...input,
    quantity: parseFloat(input.quantity),
  });
}

// Stock Adjustments
export async function listStockAdjustmentsCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listStockAdjustmentsSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    productId: q.productId ?? null,
    locationId: q.locationId ?? null,
  });

  return {
    data: data.map((a) => ({
      ...a,
      quantityChange: a.quantityChange.toString(),
      createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function createStockAdjustmentCtrl(input: {
  companyId: string;
  productId: string;
  locationId: string;
  reason: number;
  quantityChange: string;
  notes?: string | null;
  createdBy: string;
}) {
  return createStockAdjustmentSvc({
    ...input,
    quantityChange: parseFloat(input.quantityChange),
  });
}

// Stock Transfers
export async function listStockTransfersCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  productId?: string | null;
  status?: number | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listStockTransfersSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    productId: q.productId ?? null,
    status: q.status ?? null,
  });

  return {
    data: data.map((t) => ({
      ...t,
      quantity: t.quantity.toString(),
      createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
      completedAt: t.completedAt?.toISOString?.() ?? t.completedAt,
      updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getStockTransferCtrl(id: string) {
  const transfer = await getStockTransferSvc(id);
  return {
    ...transfer,
    quantity: transfer.quantity.toString(),
  };
}

export async function createStockTransferCtrl(input: {
  companyId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: string;
  notes?: string | null;
  createdBy: string;
}) {
  return createStockTransferSvc({
    ...input,
    quantity: parseFloat(input.quantity),
  });
}

export async function updateStockTransferCtrl(
  id: string,
  patch: { status: number; completedBy?: string },
) {
  return updateStockTransferSvc(id, patch);
}

// Reports
export async function getLowStockReportCtrl(companyId: string, locationId?: string | null) {
  const data = await getLowStockReportSvc(companyId, locationId);
  return {
    data: data.map((item) => ({
      ...item,
      minStockLevel: item.minStockLevel?.toString(),
      currentQuantity: item.currentQuantity?.toString(),
    })),
  };
}

export async function getMovementHistoryCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId: string;
  productId?: string | null;
  locationId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await getMovementHistorySvc({
    limit,
    after,
    companyId: q.companyId,
    productId: q.productId ?? null,
    locationId: q.locationId ?? null,
    startDate: q.startDate ? new Date(q.startDate) : null,
    endDate: q.endDate ? new Date(q.endDate) : null,
  });

  return {
    data: data.map((m) => ({
      ...m,
      quantity: m.quantity.toString(),
      createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}
