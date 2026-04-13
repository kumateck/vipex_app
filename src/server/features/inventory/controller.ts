import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import { BadRequest } from '../../utils/http-error';
import { StockAdjustmentReason, StockMovementType, TransferStatus } from '@/db/schemas/enums';
import {
  listProductCategoriesSvc,
  listProductCategoryOptionsSvc,
  getProductCategorySvc,
  createProductCategorySvc,
  updateProductCategorySvc,
  deleteProductCategorySvc,
  listProductsSvc,
  listProductOptionsSvc,
  getProductSvc,
  createProductSvc,
  updateProductSvc,
  deleteProductSvc,
  listInventoryLocationsSvc,
  listInventoryLocationOptionsSvc,
  getInventoryLocationSvc,
  createInventoryLocationSvc,
  updateInventoryLocationSvc,
  deleteInventoryLocationSvc,
  listStockLevelsSvc,
  listStockLotsSvc,
  getStockLotSvc,
  getStockLotTraceabilitySvc,
  getStockLotAnalyticsSvc,
  listStockCountSessionsSvc,
  getStockCountSessionSvc,
  createStockCountSessionSvc,
  updateStockCountSessionLineSvc,
  submitStockCountSessionSvc,
  approveStockCountSessionSvc,
  getInventoryMonitoringSummarySvc,
  runInventoryDailyAutomationSvc,
  createStockLotSvc,
  updateStockLotStatusSvc,
  runStockLotExpirySweepSvc,
  getStockLotExpiryAlertsSvc,
  getStockLevelSvc,
  listStockMovementsSvc,
  createStockMovementSvc,
  listStockAdjustmentsSvc,
  createStockAdjustmentSvc,
  listStockTransfersSvc,
  getStockTransferSvc,
  createStockTransferSvc,
  createLegacyStockTransferSvc,
  updateStockTransferSvc,
  acknowledgeStockTransferReceiptSvc,
  autoFulfillStockRequestLineSvc,
  allocateStockReservationSvc,
  approveStockRequestSvc,
  createStockRequestSvc,
  getStockAllocationPolicySvc,
  getStockReservationExceptionsSummarySvc,
  getStockReservationSvc,
  issueStockReservationSvc,
  fulfillStockRequestLineSvc,
  getStockRequestSvc,
  getStockRequestLineAllocationSvc,
  getInventoryDashboardSummarySvc,
  getStockMaintenanceRecordSvc,
  getLowStockReportSvc,
  listStockReservationsSvc,
  createStockMaintenanceRecordSvc,
  listStockMaintenanceRecordsSvc,
  listStockRequestsSvc,
  resolveStockMaintenanceRecordSvc,
  getMovementHistorySvc,
  rejectStockRequestSvc,
  acknowledgeStockRequestLineSvc,
  syncStockReservationsForRequestSvc,
  submitStockRequestSvc,
  upsertStockAllocationPolicySvc,
  listReorderSuggestionsSvc,
  listInventoryApprovalPoliciesSvc,
  createInventoryApprovalPolicySvc,
  submitInventoryApprovalRequestSvc,
  listInventoryApprovalRequestsSvc,
  decideInventoryApprovalRequestSvc,
  escalateOverdueInventoryApprovalRequestsSvc,
  getInventoryValuationSummarySvc,
  recomputeInventoryValuationSnapshotsSvc,
  syncInventoryFinancialPostingsSvc,
  generateReplenishmentProposalSvc,
  listReplenishmentProposalsSvc,
  getReplenishmentProposalSvc,
  decideReplenishmentProposalSvc,
  listInventoryTasksSvc,
  getInventoryTaskSvc,
  createInventoryTaskSvc,
  updateInventoryTaskStatusSvc,
  scanInventoryTaskSvc,
  listInventoryEventJournalSvc,
  postInventoryCorrectionSvc,
  getInventoryEnterpriseKpisSvc,
} from './service';

type UnitConversionLike = {
  factorToBase: number;
} & Record<string, unknown>;

type TransferAcceptanceRowLike = {
  acceptedQuantity?: number | null;
  damagedQuantity?: number | null;
  missingQuantity?: number | null;
  acknowledgedAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
} & Record<string, unknown>;

type StockRequestLineLike = {
  acknowledgedQuantity?: number | null;
  pendingAcknowledgementQuantity?: number | null;
  acknowledgements?: TransferAcceptanceRowLike[];
} & Record<string, unknown>;

function toIsoIfDate(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

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

export async function listProductCategoryOptionsCtrl(filters: {
  companyId?: string | null;
  search?: string | null;
}) {
  return listProductCategoryOptionsSvc(filters);
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
      unitConversions: (
        (p as { unitConversions?: UnitConversionLike[] }).unitConversions ?? []
      ).map((conversion: UnitConversionLike) => ({
        ...conversion,
        factorToBase: conversion.factorToBase.toString(),
      })),
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
    unitConversions: (product.unitConversions ?? []).map((conversion: UnitConversionLike) => ({
      ...conversion,
      factorToBase: conversion.factorToBase.toString(),
    })),
  };
}

export async function listProductOptionsCtrl(filters: {
  companyId?: string | null;
  categoryId?: string | null;
  search?: string | null;
}) {
  const options = await listProductOptionsSvc(filters);
  return options.map((product) => ({
    ...product,
    unitConversions: (
      (product as { unitConversions?: UnitConversionLike[] }).unitConversions ?? []
    ).map((conversion: UnitConversionLike) => ({
      ...conversion,
      factorToBase: conversion.factorToBase.toString(),
    })),
  }));
}

export async function createProductCtrl(input: {
  companyId: string;
  categoryId?: string | null;
  sku: string;
  name: string;
  description?: string | null;
  unitOfMeasure: number;
  unitConversions?: { unitOfMeasure: number; factorToBase: string }[];
  isRecoverable?: boolean;
  minStockLevel?: string;
  createdBy: string;
}) {
  return createProductSvc({
    ...input,
    unitConversions: input.unitConversions?.map((conversion) => ({
      unitOfMeasure: conversion.unitOfMeasure,
      factorToBase: Number.parseInt(conversion.factorToBase, 10),
    })),
    isRecoverable: input.isRecoverable ?? false,
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
    unitConversions?: { unitOfMeasure: number; factorToBase: string }[];
    isRecoverable?: boolean;
    minStockLevel?: string;
  },
) {
  return updateProductSvc(id, {
    ...patch,
    unitConversions: patch.unitConversions?.map((conversion) => ({
      unitOfMeasure: conversion.unitOfMeasure,
      factorToBase: Number.parseInt(conversion.factorToBase, 10),
    })),
    isRecoverable: patch.isRecoverable,
    minStockLevel: patch.minStockLevel ? parseFloat(patch.minStockLevel) : undefined,
  });
}

export async function deleteProductCtrl(id: string) {
  return deleteProductSvc(id);
}

// Inventory Locations
export async function listInventoryLocationsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    branchId?: string | null;
    locationType?: number | null;
    parentLocationId?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listInventoryLocationsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    branchId: q.filters?.branchId ?? null,
    locationType: q.filters?.locationType ?? null,
    parentLocationId: q.filters?.parentLocationId ?? null,
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

export async function listInventoryLocationOptionsCtrl(filters: {
  companyId?: string | null;
  branchId?: string | null;
  locationType?: number | null;
  parentLocationId?: string | null;
  search?: string | null;
}) {
  return listInventoryLocationOptionsSvc(filters);
}

export async function createInventoryLocationCtrl(input: {
  companyId: string;
  branchId: string;
  locationType?: number;
  parentLocationId?: string | null;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  return createInventoryLocationSvc(input);
}

export async function updateInventoryLocationCtrl(
  id: string,
  patch: {
    locationType?: number;
    parentLocationId?: string | null;
    name?: string;
    description?: string | null;
  },
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

export async function getProductStockLevelsCtrl(productId: string) {
  const { data } = await listStockLevelsSvc({
    limit: 1000,
    offset: 0,
    companyId: null,
    productId,
    locationId: null,
    sort: null,
  });

  return {
    data: data.map((level) => ({
      productId: level.productId,
      locationId: level.locationId,
      quantityAvailable: level.quantity.toString(),
      quantityReserved: Math.max(0, Math.floor(Number(level.quantity ?? 0) * 0.2)).toString(),
      quantity: level.quantity.toString(),
      lastCountDate: level.updatedAt?.toISOString?.() ?? null,
      updatedAt: level.updatedAt?.toISOString?.() ?? level.updatedAt,
    })),
  };
}

export async function listStockLotsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    productId?: string | null;
    locationId?: string | null;
    status?: number | null;
    batchNumber?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockLotsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    productId: q.filters?.productId ?? null,
    locationId: q.filters?.locationId ?? null,
    status: q.filters?.status ?? null,
    batchNumber: q.filters?.batchNumber ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((row) => ({
      ...row,
      quantityOnHand: Number(row.quantityOnHand ?? 0).toString(),
      reservedQuantity: Number(row.reservedQuantity ?? 0).toString(),
      receivedAt: row.receivedAt?.toISOString?.() ?? row.receivedAt,
      expiryDate: row.expiryDate?.toISOString?.() ?? row.expiryDate,
      manufacturedAt: row.manufacturedAt?.toISOString?.() ?? row.manufacturedAt,
      createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
      updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getStockLotCtrl(id: string) {
  const row = await getStockLotSvc(id);
  return {
    ...row,
    quantityOnHand: Number(row.quantityOnHand ?? 0).toString(),
    reservedQuantity: Number(row.reservedQuantity ?? 0).toString(),
    receivedAt: row.receivedAt?.toISOString?.() ?? row.receivedAt,
    expiryDate: row.expiryDate?.toISOString?.() ?? row.expiryDate,
    manufacturedAt: row.manufacturedAt?.toISOString?.() ?? row.manufacturedAt,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    movements: row.movements.map((m) => ({
      ...m,
      quantity: Number(m.quantity ?? 0).toString(),
      createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    })),
  };
}

export async function getStockLotTraceabilityCtrl(lotId: string) {
  const row = await getStockLotTraceabilitySvc({ lotId });
  return {
    lot: {
      ...row.lot,
      quantityOnHand: Number(row.lot.quantityOnHand ?? 0).toString(),
      reservedQuantity: Number(row.lot.reservedQuantity ?? 0).toString(),
      receivedAt: row.lot.receivedAt?.toISOString?.() ?? row.lot.receivedAt,
      expiryDate: row.lot.expiryDate?.toISOString?.() ?? row.lot.expiryDate,
      manufacturedAt: row.lot.manufacturedAt?.toISOString?.() ?? row.lot.manufacturedAt,
      createdAt: row.lot.createdAt?.toISOString?.() ?? row.lot.createdAt,
      updatedAt: row.lot.updatedAt?.toISOString?.() ?? row.lot.updatedAt,
    },
    movements: row.movements.map((movement) => ({
      ...movement,
      quantity: Number(movement.quantity ?? 0).toString(),
      createdAt: movement.createdAt?.toISOString?.() ?? movement.createdAt,
    })),
    procurementLinks: row.procurementLinks.map((link) => ({
      ...link,
      receivedQuantity: Number(link.receivedQuantity ?? 0).toString(),
      receivedAt: link.receivedAt?.toISOString?.() ?? link.receivedAt,
    })),
  };
}

export async function createStockLotCtrl(input: {
  companyId: string;
  productId: string;
  locationId: string;
  batchNumber: string;
  quantityOnHand: string;
  supplierBatchNumber?: string | null;
  expiryDate?: string | null;
  manufacturedAt?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  return createStockLotSvc({
    ...input,
    quantityOnHand: Number.parseInt(input.quantityOnHand, 10),
    expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
    manufacturedAt: input.manufacturedAt ? new Date(input.manufacturedAt) : null,
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : null,
  });
}

export async function updateStockLotStatusCtrl(input: {
  id: string;
  status?: number;
  notes?: string | null;
}) {
  return updateStockLotStatusSvc(input);
}

export async function runStockLotExpirySweepCtrl(input: {
  companyId: string;
  actorUserId: string;
}) {
  return runStockLotExpirySweepSvc(input);
}

export async function getStockLotExpiryAlertsCtrl(input: {
  companyId: string;
  daysAhead?: number;
  locationId?: string | null;
}) {
  const result = await getStockLotExpiryAlertsSvc(input);
  return {
    ...result,
    rows: result.rows.map((row) => ({
      ...row,
      quantityOnHand: Number(row.quantityOnHand ?? 0).toString(),
      reservedQuantity: Number(row.reservedQuantity ?? 0).toString(),
      expiryDate: row.expiryDate?.toISOString?.() ?? row.expiryDate,
    })),
    totals: {
      ...result.totals,
      atRiskQuantity: result.totals.atRiskQuantity.toString(),
    },
  };
}

export async function getStockLotAnalyticsCtrl(input: {
  companyId: string;
  daysAhead?: number;
  issueLookbackDays?: number;
  locationId?: string | null;
}) {
  const result = await getStockLotAnalyticsSvc(input);
  return result;
}

export async function listStockCountSessionsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    locationId?: string | null;
    status?: number | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockCountSessionsSvc({
    companyId: q.filters!.companyId,
    locationId: q.filters?.locationId ?? null,
    status: q.filters?.status ?? null,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  return {
    data: data.map((row) => ({
      ...row,
      createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
      updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
      submittedAt: row.submittedAt?.toISOString?.() ?? row.submittedAt,
      approvedAt: row.approvedAt?.toISOString?.() ?? row.approvedAt,
      cancelledAt: row.cancelledAt?.toISOString?.() ?? row.cancelledAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getStockCountSessionCtrl(id: string) {
  const row = await getStockCountSessionSvc(id);
  return {
    ...row,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    submittedAt: row.submittedAt?.toISOString?.() ?? row.submittedAt,
    approvedAt: row.approvedAt?.toISOString?.() ?? row.approvedAt,
    cancelledAt: row.cancelledAt?.toISOString?.() ?? row.cancelledAt,
    lines: row.lines.map((line) => ({
      ...line,
      systemQuantity: Number(line.systemQuantity ?? 0).toString(),
      countedQuantity: Number(line.countedQuantity ?? 0).toString(),
      varianceQuantity: Number(line.varianceQuantity ?? 0).toString(),
      countedAt: line.countedAt?.toISOString?.() ?? line.countedAt,
      createdAt: line.createdAt?.toISOString?.() ?? line.createdAt,
      updatedAt: line.updatedAt?.toISOString?.() ?? line.updatedAt,
    })),
  };
}

export async function createStockCountSessionCtrl(input: {
  companyId: string;
  locationId: string;
  notes?: string | null;
  createdBy: string;
  productIds?: string[];
}) {
  return createStockCountSessionSvc(input);
}

export async function updateStockCountSessionLineCtrl(input: {
  sessionId: string;
  lineId: string;
  countedQuantity: string;
  varianceReason?: string | null;
  countedBy: string;
}) {
  return updateStockCountSessionLineSvc({
    sessionId: input.sessionId,
    lineId: input.lineId,
    countedQuantity: Number.parseInt(input.countedQuantity, 10),
    varianceReason: input.varianceReason ?? null,
    countedBy: input.countedBy,
  });
}

export async function submitStockCountSessionCtrl(input: { id: string; submittedBy: string }) {
  return submitStockCountSessionSvc(input);
}

export async function approveStockCountSessionCtrl(input: {
  id: string;
  approvedBy: string;
  applyAdjustments?: boolean;
}) {
  return approveStockCountSessionSvc(input);
}

export async function getInventoryMonitoringSummaryCtrl(input: {
  companyId: string;
  daysAhead?: number;
  issueLookbackDays?: number;
}) {
  return getInventoryMonitoringSummarySvc(input);
}

export async function runInventoryDailyAutomationCtrl(input: {
  companyId: string;
  actorUserId: string;
  daysAhead?: number;
  sendEmailAlerts?: boolean;
  recipientEmails?: string[];
}) {
  return runInventoryDailyAutomationSvc(input);
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
  companyId?: string;
  productId: string;
  locationId: string;
  movementType: number;
  quantity: string;
  batchNumber?: string | null;
  sourceLotId?: string | null;
  supplierBatchNumber?: string | null;
  expiryDate?: string | null;
  manufacturedAt?: string | null;
  receivedAt?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  if (!Object.values(StockMovementType).includes(input.movementType as StockMovementType)) {
    throw BadRequest('Invalid stock movement type');
  }
  const location = await getInventoryLocationSvc(input.locationId);
  return createStockMovementSvc({
    ...input,
    companyId: input.companyId ?? location.companyId,
    quantity: parseFloat(input.quantity),
    expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
    manufacturedAt: input.manufacturedAt ? new Date(input.manufacturedAt) : null,
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : null,
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
  companyId?: string;
  productId: string;
  locationId: string;
  reason: number;
  quantityChange?: string;
  quantity?: string;
  batchNumber?: string | null;
  sourceLotId?: string | null;
  supplierBatchNumber?: string | null;
  expiryDate?: string | null;
  manufacturedAt?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  if (!Object.values(StockAdjustmentReason).includes(input.reason as StockAdjustmentReason)) {
    throw BadRequest('Invalid stock adjustment reason');
  }
  const location = await getInventoryLocationSvc(input.locationId);
  const rawQty = input.quantityChange ?? input.quantity;
  if (rawQty === undefined) throw BadRequest('quantityChange (or quantity) is required');
  let quantityChange = parseFloat(rawQty);
  if (input.quantity !== undefined && input.reason === StockAdjustmentReason.RECOUNT) {
    const current = await getStockLevelSvc(input.productId, input.locationId).catch(() => null);
    const currentQty = Number(current?.quantity ?? 0);
    quantityChange = parseFloat(input.quantity) - currentQty;
  }
  return createStockAdjustmentSvc({
    ...input,
    companyId: input.companyId ?? location.companyId,
    quantityChange,
    expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
    manufacturedAt: input.manufacturedAt ? new Date(input.manufacturedAt) : null,
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
      fulfilledQuantity: t.fulfilledQuantity.toString(),
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
    fulfilledQuantity: transfer.fulfilledQuantity.toString(),
    acceptance: transfer.acceptance
      ? {
          ...transfer.acceptance,
          totalAccepted: Number(transfer.acceptance.totalAccepted ?? 0).toString(),
          totalDamaged: Number(transfer.acceptance.totalDamaged ?? 0).toString(),
          totalMissing: Number(transfer.acceptance.totalMissing ?? 0).toString(),
          netReceived: Number(transfer.acceptance.netReceived ?? 0).toString(),
          pendingToAcknowledge: Number(transfer.acceptance.pendingToAcknowledge ?? 0).toString(),
          rows: (transfer.acceptance.rows ?? []).map((row: TransferAcceptanceRowLike) => ({
            ...row,
            acceptedQuantity: Number(row.acceptedQuantity ?? 0).toString(),
            damagedQuantity: Number(row.damagedQuantity ?? 0).toString(),
            missingQuantity: Number(row.missingQuantity ?? 0).toString(),
            acknowledgedAt: toIsoIfDate(row.acknowledgedAt),
            createdAt: toIsoIfDate(row.createdAt),
            updatedAt: toIsoIfDate(row.updatedAt),
          })),
        }
      : undefined,
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
  patch: { status?: number; fulfillQuantity?: string; completedBy?: string; notes?: string | null },
) {
  return updateStockTransferSvc(id, {
    ...patch,
    fulfillQuantity: patch.fulfillQuantity ? Number.parseInt(patch.fulfillQuantity, 10) : undefined,
  });
}

// Legacy stock transfer contract compatibility (/transfers)
export async function listLegacyTransfersCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    productId?: string | null;
    status?: number | null;
    fromLocationId?: string | null;
    toLocationId?: string | null;
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

  const filtered = data.filter((row) => {
    if (q.filters?.fromLocationId && row.fromLocationId !== q.filters.fromLocationId) return false;
    if (q.filters?.toLocationId && row.toLocationId !== q.filters.toLocationId) return false;
    return true;
  });

  return {
    data: filtered.map((row) => ({
      ...row,
      transferNumber: `TR-${row.id}`,
      shippedAt:
        row.status === TransferStatus.IN_TRANSIT ||
        row.status === TransferStatus.PARTIALLY_FULFILLED ||
        row.status === TransferStatus.COMPLETED
          ? (row.updatedAt?.toISOString?.() ?? row.updatedAt)
          : null,
      cancelledAt:
        row.status === TransferStatus.CANCELLED
          ? (row.updatedAt?.toISOString?.() ?? row.updatedAt)
          : null,
      cancellationReason: row.status === TransferStatus.CANCELLED ? (row.notes ?? null) : null,
      quantity: row.quantity.toString(),
      fulfilledQuantity: row.fulfilledQuantity.toString(),
      createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
      completedAt: row.completedAt?.toISOString?.() ?? row.completedAt,
      updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getLegacyTransferCtrl(id: string) {
  const transfer = await getStockTransferSvc(id);
  return {
    ...transfer,
    transferNumber: `TR-${transfer.id}`,
    shippedAt:
      transfer.status === TransferStatus.IN_TRANSIT ||
      transfer.status === TransferStatus.PARTIALLY_FULFILLED ||
      transfer.status === TransferStatus.COMPLETED
        ? (transfer.updatedAt?.toISOString?.() ?? transfer.updatedAt)
        : null,
    cancelledAt:
      transfer.status === TransferStatus.CANCELLED
        ? (transfer.updatedAt?.toISOString?.() ?? transfer.updatedAt)
        : null,
    cancellationReason:
      transfer.status === TransferStatus.CANCELLED ? (transfer.notes ?? null) : null,
    quantity: transfer.quantity.toString(),
    fulfilledQuantity: transfer.fulfilledQuantity.toString(),
    items: [
      {
        productId: transfer.productId,
        quantityRequested: transfer.quantity.toString(),
      },
    ],
  };
}

export async function createLegacyTransferCtrl(input: {
  fromLocationId: string;
  toLocationId: string;
  items: Array<{ productId: string; quantityRequested: string; notes?: string | null }>;
  notes?: string | null;
  requestedBy: string;
}) {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw BadRequest('At least one transfer item is required');
  }

  const firstItem = input.items[0];
  if (!firstItem) throw BadRequest('At least one transfer item is required');

  const fromLocation = await getInventoryLocationSvc(input.fromLocationId);
  const created = await createLegacyStockTransferSvc({
    companyId: fromLocation.companyId,
    productId: firstItem.productId,
    fromLocationId: input.fromLocationId,
    toLocationId: input.toLocationId,
    quantity: Number.parseInt(firstItem.quantityRequested, 10),
    notes: input.notes ?? firstItem.notes ?? null,
    createdBy: input.requestedBy,
  });
  if (!created.id) throw BadRequest('Failed to create stock transfer');
  return { id: created.id };
}

export async function updateLegacyTransferStatusCtrl(
  id: string,
  patch: {
    status: number;
    notes?: string | null;
    cancellationReason?: string | null;
  },
) {
  return updateStockTransferSvc(id, {
    status: patch.status,
    notes: patch.cancellationReason ?? patch.notes ?? undefined,
  });
}

export async function completeLegacyTransferCtrl(id: string, input: { userId: string }) {
  const transfer = await getStockTransferSvc(id);
  if (transfer.status !== TransferStatus.IN_TRANSIT) {
    throw BadRequest('Only in-transit transfers can be completed');
  }
  return updateStockTransferSvc(id, {
    status: TransferStatus.COMPLETED,
    completedBy: input.userId,
  });
}

export async function acknowledgeStockTransferReceiptCtrl(input: {
  transferId: string;
  acceptedQuantity: string;
  damagedQuantity?: string;
  missingQuantity?: string;
  notes?: string | null;
  acknowledgedBy: string;
}) {
  return acknowledgeStockTransferReceiptSvc({
    transferId: input.transferId,
    acceptedQuantity: Number.parseInt(input.acceptedQuantity, 10),
    damagedQuantity: input.damagedQuantity ? Number.parseInt(input.damagedQuantity, 10) : 0,
    missingQuantity: input.missingQuantity ? Number.parseInt(input.missingQuantity, 10) : 0,
    notes: input.notes ?? null,
    acknowledgedBy: input.acknowledgedBy,
  });
}

// Stock Requests
export async function listStockRequestsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    requesterLocationId?: string | null;
    status?: number | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockRequestsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    requesterLocationId: q.filters?.requesterLocationId ?? null,
    status: q.filters?.status ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((request) => ({
      ...request,
      createdAt: request.createdAt?.toISOString?.() ?? request.createdAt,
      updatedAt: request.updatedAt?.toISOString?.() ?? request.updatedAt,
      approvedAt: request.approvedAt?.toISOString?.() ?? request.approvedAt,
      rejectedAt: request.rejectedAt?.toISOString?.() ?? request.rejectedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getStockRequestCtrl(id: string) {
  const request = await getStockRequestSvc(id);
  return {
    ...request,
    createdAt: request.createdAt?.toISOString?.() ?? request.createdAt,
    updatedAt: request.updatedAt?.toISOString?.() ?? request.updatedAt,
    approvedAt: request.approvedAt?.toISOString?.() ?? request.approvedAt,
    rejectedAt: request.rejectedAt?.toISOString?.() ?? request.rejectedAt,
    lines: request.lines.map((line) => ({
      ...line,
      requestedQuantity: line.requestedQuantity.toString(),
      fulfilledQuantity: line.fulfilledQuantity.toString(),
      acknowledgedQuantity: Number(
        (line as StockRequestLineLike).acknowledgedQuantity ?? 0,
      ).toString(),
      pendingAcknowledgementQuantity: Number(
        (line as StockRequestLineLike).pendingAcknowledgementQuantity ?? 0,
      ).toString(),
      acknowledgements: (
        ((line as StockRequestLineLike).acknowledgements ?? []) as TransferAcceptanceRowLike[]
      ).map((row) => ({
        ...row,
        acknowledgedQuantity: Number(row.acknowledgedQuantity ?? 0).toString(),
        acknowledgedAt: toIsoIfDate(row.acknowledgedAt),
        createdAt: toIsoIfDate(row.createdAt),
        updatedAt: toIsoIfDate(row.updatedAt),
      })),
      createdAt: line.createdAt?.toISOString?.() ?? line.createdAt,
      updatedAt: line.updatedAt?.toISOString?.() ?? line.updatedAt,
    })),
  };
}

export async function createStockRequestCtrl(input: {
  companyId: string;
  requesterLocationId: string;
  requestedToLocationId?: string | null;
  notes?: string | null;
  requestedBy: string;
  submit?: boolean;
  lines: { productId: string; requestedQuantity: string; notes?: string | null }[];
}) {
  return createStockRequestSvc({
    ...input,
    lines: input.lines.map((line) => ({
      ...line,
      requestedQuantity: Number.parseInt(line.requestedQuantity, 10),
    })),
  });
}

export async function submitStockRequestCtrl(id: string) {
  return submitStockRequestSvc(id);
}

export async function approveStockRequestCtrl(id: string, approvedBy: string) {
  return approveStockRequestSvc(id, approvedBy);
}

export async function rejectStockRequestCtrl(
  id: string,
  rejectedBy: string,
  reason?: string | null,
) {
  return rejectStockRequestSvc(id, rejectedBy, reason ?? null);
}

export async function fulfillStockRequestLineCtrl(input: {
  requestId: string;
  lineId: string;
  fromLocationId: string;
  fulfillQuantity: string;
  fulfilledBy: string;
  notes?: string | null;
}) {
  return fulfillStockRequestLineSvc({
    ...input,
    fulfillQuantity: Number.parseInt(input.fulfillQuantity, 10),
  });
}

export async function getStockRequestLineAllocationCtrl(input: {
  requestId: string;
  lineId: string;
}) {
  return getStockRequestLineAllocationSvc(input);
}

export async function autoFulfillStockRequestLineCtrl(input: {
  requestId: string;
  lineId: string;
  fulfilledBy: string;
  notes?: string | null;
}) {
  return autoFulfillStockRequestLineSvc(input);
}

export async function acknowledgeStockRequestLineCtrl(input: {
  requestId: string;
  lineId: string;
  acknowledgedQuantity: string;
  acknowledgedBy: string;
  notes?: string | null;
}) {
  return acknowledgeStockRequestLineSvc({
    requestId: input.requestId,
    lineId: input.lineId,
    acknowledgedQuantity: Number.parseInt(input.acknowledgedQuantity, 10),
    acknowledgedBy: input.acknowledgedBy,
    notes: input.notes ?? null,
  });
}

export async function syncStockReservationsForRequestCtrl(input: {
  requestId: string;
  actorUserId: string;
}) {
  return syncStockReservationsForRequestSvc(input);
}

export async function listStockReservationsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    status?: number | null;
    requestId?: string | null;
    productId?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockReservationsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    status: q.filters?.status ?? null,
    requestId: q.filters?.requestId ?? null,
    productId: q.filters?.productId ?? null,
    sort: pagination.sort ?? null,
  });
  return {
    data: data.map((row) => ({
      ...row,
      requestedQuantity: Number(row.requestedQuantity ?? 0).toString(),
      reservedQuantity: Number(row.reservedQuantity ?? 0).toString(),
      issuedQuantity: Number(row.issuedQuantity ?? 0).toString(),
      shortQuantity: Number(row.shortQuantity ?? 0).toString(),
      createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
      updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getStockReservationCtrl(id: string) {
  const row = await getStockReservationSvc(id);
  return {
    ...row,
    requestedQuantity: Number(row.requestedQuantity ?? 0).toString(),
    reservedQuantity: Number(row.reservedQuantity ?? 0).toString(),
    issuedQuantity: Number(row.issuedQuantity ?? 0).toString(),
    shortQuantity: Number(row.shortQuantity ?? 0).toString(),
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    allocations: row.allocations.map((allocation) => ({
      ...allocation,
      reservedQuantity: Number(allocation.reservedQuantity ?? 0).toString(),
      issuedQuantity: Number(allocation.issuedQuantity ?? 0).toString(),
      createdAt: allocation.createdAt?.toISOString?.() ?? allocation.createdAt,
      updatedAt: allocation.updatedAt?.toISOString?.() ?? allocation.updatedAt,
    })),
  };
}

export async function allocateStockReservationCtrl(input: {
  reservationId: string;
  actorUserId: string;
}) {
  return allocateStockReservationSvc(input);
}

export async function issueStockReservationCtrl(input: {
  reservationId: string;
  actorUserId: string;
  notes?: string | null;
}) {
  return issueStockReservationSvc(input);
}

export async function getStockReservationExceptionsSummaryCtrl(companyId: string) {
  return getStockReservationExceptionsSummarySvc(companyId);
}

export async function getStockAllocationPolicyCtrl(input: {
  companyId: string;
  requesterRootLocationId?: string | null;
}) {
  const policy = await getStockAllocationPolicySvc(input);
  return {
    ...policy,
    createdAt: policy.createdAt?.toISOString?.() ?? policy.createdAt,
    updatedAt: policy.updatedAt?.toISOString?.() ?? policy.updatedAt,
  };
}

export async function upsertStockAllocationPolicyCtrl(input: {
  companyId: string;
  requesterRootLocationId?: string | null;
  strategy: number;
  allowPartial?: boolean;
  prioritizeSameBranch?: boolean;
  maxSourceLocations?: number;
  active?: boolean;
  createdBy: string;
}) {
  return upsertStockAllocationPolicySvc(input);
}

export async function listReorderSuggestionsCtrl(input: {
  companyId: string;
  locationId?: string | null;
  includeZeroMin?: boolean;
}) {
  const result = await listReorderSuggestionsSvc(input);
  return {
    ...result,
    rows: result.rows.map((row) => ({
      ...row,
      currentQuantity: Number(row.currentQuantity ?? 0).toString(),
      minStockLevel: Number(row.minStockLevel ?? 0).toString(),
      reorderQuantity: Number(row.reorderQuantity ?? 0).toString(),
      suggestedSources: row.suggestedSources.map((source) => ({
        ...source,
        availableQuantity: Number(source.availableQuantity ?? 0).toString(),
      })),
    })),
  };
}

export async function getInventoryDashboardSummaryCtrl(filters: {
  companyId: string;
  locationId?: string | null;
  lowStockLimit?: number | null;
}) {
  const data = await getInventoryDashboardSummarySvc(filters);
  return {
    ...data,
    totals: {
      ...data.totals,
      totalQuantity: data.totals.totalQuantity.toString(),
      openMaintenanceQty: data.totals.openMaintenanceQty.toString(),
      missingQty: data.totals.missingQty.toString(),
    },
    lowStockItems: data.lowStockItems.map((item) => ({
      ...item,
      quantity: Number(item.quantity ?? 0).toString(),
      minStockLevel: Number(item.minStockLevel ?? 0).toString(),
    })),
    openMaintenanceItems: data.openMaintenanceItems.map((row) => ({
      ...row,
      quantity: Number(row.quantity ?? 0).toString(),
      quantityReturned: Number(row.quantityReturned ?? 0).toString(),
      quantityDisposed: Number(row.quantityDisposed ?? 0).toString(),
      createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    })),
  };
}

export async function listStockMaintenanceRecordsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    locationId?: string | null;
    issueType?: number | null;
    status?: number | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listStockMaintenanceRecordsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    locationId: q.filters?.locationId ?? null,
    issueType: q.filters?.issueType ?? null,
    status: q.filters?.status ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((row) => ({
      ...row,
      quantity: Number(row.quantity ?? 0).toString(),
      quantityReturned: Number(row.quantityReturned ?? 0).toString(),
      quantityDisposed: Number(row.quantityDisposed ?? 0).toString(),
      createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
      resolvedAt: row.resolvedAt?.toISOString?.() ?? row.resolvedAt,
      updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getStockMaintenanceRecordCtrl(id: string) {
  const row = await getStockMaintenanceRecordSvc(id);
  return {
    ...row,
    quantity: Number(row.quantity ?? 0).toString(),
    quantityReturned: Number(row.quantityReturned ?? 0).toString(),
    quantityDisposed: Number(row.quantityDisposed ?? 0).toString(),
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    resolvedAt: row.resolvedAt?.toISOString?.() ?? row.resolvedAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

export async function createStockMaintenanceRecordCtrl(input: {
  companyId: string;
  productId: string;
  locationId: string;
  issueType: number;
  quantity: string;
  notes?: string | null;
  createdBy: string;
}) {
  return createStockMaintenanceRecordSvc({
    ...input,
    quantity: Number.parseInt(input.quantity, 10),
  });
}

export async function resolveStockMaintenanceRecordCtrl(input: {
  id: string;
  quantityReturned?: string | null;
  quantityDisposed?: string | null;
  notes?: string | null;
  resolvedBy: string;
}) {
  return resolveStockMaintenanceRecordSvc({
    id: input.id,
    quantityReturned:
      input.quantityReturned !== undefined && input.quantityReturned !== null
        ? Number.parseInt(input.quantityReturned, 10)
        : undefined,
    quantityDisposed:
      input.quantityDisposed !== undefined && input.quantityDisposed !== null
        ? Number.parseInt(input.quantityDisposed, 10)
        : undefined,
    notes: input.notes ?? null,
    resolvedBy: input.resolvedBy,
  });
}

// Reports
export async function getLowStockReportCtrl(filters: {
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
}) {
  const data = await getLowStockReportSvc(filters);
  return {
    data: data.map((item) => ({
      ...item,
      minStockLevel: item.minStockLevel?.toString(),
      quantity: item.quantity?.toString(),
      deficit: (Number(item.minStockLevel) - Number(item.quantity)).toString(),
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

// 1) Approval policy engine
export async function listInventoryApprovalPoliciesCtrl(input: {
  companyId: string;
  entityType?: number | null;
  active?: boolean | null;
}) {
  const rows = await listInventoryApprovalPoliciesSvc(input);
  return rows.map((row) => ({
    ...row,
    minAmount: Number(row.minAmount ?? 0),
    maxAmount: row.maxAmount === null ? null : Number(row.maxAmount),
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  }));
}

export async function createInventoryApprovalPolicyCtrl(input: {
  companyId: string;
  entityType: number;
  minAmount?: number;
  maxAmount?: number | null;
  locationType?: number | null;
  level1ApproverRoleId?: string | null;
  level2ApproverRoleId?: string | null;
  slaHours?: number;
  escalationRoleId?: string | null;
  active?: boolean;
  createdBy: string;
}) {
  return createInventoryApprovalPolicySvc(input);
}

export async function submitInventoryApprovalRequestCtrl(input: {
  companyId: string;
  entityType: number;
  entityId: string;
  amount: number;
  submittedBy: string;
}) {
  return submitInventoryApprovalRequestSvc(input);
}

export async function listInventoryApprovalRequestsCtrl(input: {
  companyId: string;
  status?: number | null;
  entityType?: number | null;
}) {
  const rows = await listInventoryApprovalRequestsSvc(input);
  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount ?? 0),
    submittedAt: row.submittedAt?.toISOString?.() ?? row.submittedAt,
    dueAt: row.dueAt?.toISOString?.() ?? row.dueAt,
    decidedAt: row.decidedAt?.toISOString?.() ?? row.decidedAt,
    escalationAt: row.escalationAt?.toISOString?.() ?? row.escalationAt,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  }));
}

export async function decideInventoryApprovalRequestCtrl(input: {
  id: string;
  status: number;
  decidedBy: string;
  reason?: string | null;
}) {
  return decideInventoryApprovalRequestSvc(input);
}

export async function escalateOverdueInventoryApprovalRequestsCtrl(input: {
  companyId: string;
  actorUserId: string;
}) {
  return escalateOverdueInventoryApprovalRequestsSvc(input);
}

// 2) Valuation + finance integration
export async function getInventoryValuationSummaryCtrl(input: {
  companyId: string;
  locationId?: string | null;
}) {
  const result = await getInventoryValuationSummarySvc(input);
  return {
    ...result,
    totals: {
      totalQuantity: Number(result.totals.totalQuantity ?? 0).toString(),
      totalValue: Number(result.totals.totalValue ?? 0).toString(),
    },
    rows: result.rows.map((row) => ({
      ...row,
      quantity: Number(row.quantity ?? 0).toString(),
      averageUnitCost: Number(row.averageUnitCost ?? 0).toString(),
      totalValue: Number(row.totalValue ?? 0).toString(),
    })),
  };
}

export async function recomputeInventoryValuationSnapshotsCtrl(input: {
  companyId: string;
  method?: number;
  actorUserId: string;
}) {
  return recomputeInventoryValuationSnapshotsSvc(input);
}

export async function syncInventoryFinancialPostingsCtrl(input: {
  companyId: string;
  actorUserId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  return syncInventoryFinancialPostingsSvc({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    dateFrom: input.dateFrom ? new Date(input.dateFrom) : null,
    dateTo: input.dateTo ? new Date(input.dateTo) : null,
  });
}

// 3) Planning engine
export async function generateReplenishmentProposalCtrl(input: {
  companyId: string;
  scopeLocationId?: string | null;
  leadTimeDays?: number;
  coverageDays?: number;
  notes?: string | null;
  generatedBy: string;
}) {
  return generateReplenishmentProposalSvc(input);
}

export async function listReplenishmentProposalsCtrl(input: {
  companyId: string;
  status?: number | null;
}) {
  const rows = await listReplenishmentProposalsSvc(input);
  return rows.map((row) => ({
    ...row,
    generatedAt: row.generatedAt?.toISOString?.() ?? row.generatedAt,
    approvedAt: row.approvedAt?.toISOString?.() ?? row.approvedAt,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  }));
}

export async function getReplenishmentProposalCtrl(id: string) {
  const row = await getReplenishmentProposalSvc(id);
  return {
    ...row,
    generatedAt: row.generatedAt?.toISOString?.() ?? row.generatedAt,
    approvedAt: row.approvedAt?.toISOString?.() ?? row.approvedAt,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    lines: row.lines.map((line) => ({
      ...line,
      currentQuantity: Number(line.currentQuantity ?? 0).toString(),
      minStockLevel: Number(line.minStockLevel ?? 0).toString(),
      suggestedQuantity: Number(line.suggestedQuantity ?? 0).toString(),
      approvedQuantity:
        (line as { approvedQuantity?: number | null }).approvedQuantity === null
          ? null
          : Number((line as { approvedQuantity?: number | null }).approvedQuantity ?? 0).toString(),
      createdAt: line.createdAt?.toISOString?.() ?? line.createdAt,
      updatedAt: line.updatedAt?.toISOString?.() ?? line.updatedAt,
    })),
  };
}

export async function decideReplenishmentProposalCtrl(input: {
  id: string;
  status: number;
  actorUserId: string;
}) {
  return decideReplenishmentProposalSvc(input);
}

// 4) Physical operations layer
export async function listInventoryTasksCtrl(input: {
  companyId: string;
  status?: number | null;
  taskType?: number | null;
}) {
  const rows = await listInventoryTasksSvc(input);
  return rows.map((row) => ({
    ...row,
    plannedQuantity: Number(row.plannedQuantity ?? 0).toString(),
    processedQuantity: Number(row.processedQuantity ?? 0).toString(),
    dueAt: toIsoIfDate((row as { dueAt?: Date | string | null }).dueAt),
    startedAt: row.startedAt?.toISOString?.() ?? row.startedAt,
    completedAt: row.completedAt?.toISOString?.() ?? row.completedAt,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  }));
}

export async function getInventoryTaskCtrl(id: string) {
  const row = await getInventoryTaskSvc(id);
  return {
    ...row,
    plannedQuantity: Number(row.plannedQuantity ?? 0).toString(),
    processedQuantity: Number(row.processedQuantity ?? 0).toString(),
    dueAt: toIsoIfDate((row as { dueAt?: Date | string | null }).dueAt),
    startedAt: row.startedAt?.toISOString?.() ?? row.startedAt,
    completedAt: row.completedAt?.toISOString?.() ?? row.completedAt,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    scans: row.scans.map((scan) => ({
      ...scan,
      quantity: Number(scan.quantity ?? 0).toString(),
      scannedAt: scan.scannedAt?.toISOString?.() ?? scan.scannedAt,
      createdAt: scan.createdAt?.toISOString?.() ?? scan.createdAt,
      updatedAt: toIsoIfDate((scan as { updatedAt?: Date | string | null }).updatedAt),
    })),
  };
}

export async function createInventoryTaskCtrl(input: {
  companyId: string;
  taskType: number;
  productId?: string | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  plannedQuantity?: string;
  assignedTo?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  return createInventoryTaskSvc({
    ...input,
    plannedQuantity:
      input.plannedQuantity !== undefined ? Number.parseInt(input.plannedQuantity, 10) : undefined,
  });
}

export async function updateInventoryTaskStatusCtrl(input: {
  id: string;
  status: number;
  actorUserId: string;
}) {
  return updateInventoryTaskStatusSvc(input);
}

export async function scanInventoryTaskCtrl(input: {
  taskId: string;
  scanCode: string;
  quantity: string;
  scannedBy: string;
}) {
  return scanInventoryTaskSvc({
    taskId: input.taskId,
    scanCode: input.scanCode,
    quantity: Number.parseInt(input.quantity, 10),
    scannedBy: input.scannedBy,
  });
}

// 5) Audit/compliance hardening
export async function listInventoryEventJournalCtrl(input: {
  companyId: string;
  entityType?: string | null;
  entityId?: string | null;
  eventType?: number | null;
}) {
  const rows = await listInventoryEventJournalSvc(input);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
  }));
}

export async function postInventoryCorrectionCtrl(input: {
  companyId: string;
  productId: string;
  locationId: string;
  quantityChange: string;
  notes?: string | null;
  actorUserId: string;
}) {
  return postInventoryCorrectionSvc({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    quantityChange: Number.parseInt(input.quantityChange, 10),
    notes: input.notes ?? null,
    actorUserId: input.actorUserId,
  });
}

// 6) Enterprise reporting pack
export async function getInventoryEnterpriseKpisCtrl(input: {
  companyId: string;
  locationId?: string | null;
  days?: number;
}) {
  const result = await getInventoryEnterpriseKpisSvc(input);
  return {
    ...result,
    movements: {
      ...result.movements,
      issueQuantity: Number(result.movements.issueQuantity ?? 0).toString(),
      receiptQuantity: Number(result.movements.receiptQuantity ?? 0).toString(),
    },
    serviceLevel: {
      ...result.serviceLevel,
      requestedQuantity: Number(result.serviceLevel.requestedQuantity ?? 0).toString(),
      fulfilledQuantity: Number(result.serviceLevel.fulfilledQuantity ?? 0).toString(),
    },
    aging: {
      ...result.aging,
      atRiskQuantity: Number(result.aging.atRiskQuantity ?? 0).toString(),
    },
  };
}
