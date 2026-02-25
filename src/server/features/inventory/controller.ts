import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
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
export async function listProductCategoriesCtrl(
  q: PaginationRequestDto<{ companyId?: string | null }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listProductCategoriesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((c) => ({
      ...c,
      createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
      updatedAt: c.updatedAt?.toISOString?.() ?? c.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
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
export async function listProductsCtrl(
  q: PaginationRequestDto<{ companyId?: string | null; categoryId?: string | null }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listProductsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    categoryId: q.filters?.categoryId ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((p) => ({
      ...p,
      minStockLevel: p.minStockLevel.toString(),
      createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
      updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
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
export async function listInventoryLocationsCtrl(
  q: PaginationRequestDto<{ companyId?: string | null; branchId?: string | null }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listInventoryLocationsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    branchId: q.filters?.branchId ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((l) => ({
      ...l,
      createdAt: l.createdAt?.toISOString?.() ?? l.createdAt,
      updatedAt: l.updatedAt?.toISOString?.() ?? l.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
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
export async function listStockLevelsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    productId?: string | null;
    locationId?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockLevelsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    productId: q.filters?.productId ?? null,
    locationId: q.filters?.locationId ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((l) => ({
      ...l,
      quantity: l.quantity.toString(),
      updatedAt: l.updatedAt?.toISOString?.() ?? l.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
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
export async function listStockMovementsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    productId?: string | null;
    locationId?: string | null;
    movementType?: number | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockMovementsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    productId: q.filters?.productId ?? null,
    locationId: q.filters?.locationId ?? null,
    movementType: q.filters?.movementType ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((m) => ({
      ...m,
      quantity: m.quantity.toString(),
      createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
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
export async function listStockAdjustmentsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    productId?: string | null;
    locationId?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockAdjustmentsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    productId: q.filters?.productId ?? null,
    locationId: q.filters?.locationId ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((a) => ({
      ...a,
      quantityChange: a.quantityChange.toString(),
      createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
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
export async function listStockTransfersCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    productId?: string | null;
    status?: number | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockTransfersSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    productId: q.filters?.productId ?? null,
    status: q.filters?.status ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((t) => ({
      ...t,
      quantity: t.quantity.toString(),
      createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
      completedAt: t.completedAt?.toISOString?.() ?? t.completedAt,
      updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
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

export async function getMovementHistoryCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    productId?: string | null;
    locationId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await getMovementHistorySvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? '',
    productId: q.filters?.productId ?? null,
    locationId: q.filters?.locationId ?? null,
    startDate: q.filters?.startDate ? new Date(q.filters.startDate) : null,
    endDate: q.filters?.endDate ? new Date(q.filters.endDate) : null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((m) => ({
      ...m,
      quantity: m.quantity.toString(),
      createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}
