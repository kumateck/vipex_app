import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto, PaginatedResponseDto } from '@/server/types/pagination.types';
import {
  acceptProcurementSupplierQuoteSvc,
  approveProcurementDemandSvc,
  approvePurchaseRequestSvc,
  consolidateProcurementDemandsSvc,
  convertProcurementDemandsToPurchaseRequestsSvc,
  createProcurementDemandSvc,
  createProcurementDemandsFromInventoryLowStockSvc,
  createProcurementDemandsFromFleetLowStockSvc,
  createProcurementFleetPolicySvc,
  createProcurementGoodsReceiptSvc,
  createProcurementPurchaseOrderFromAcceptedQuotesSvc,
  createProcurementSupplierQuoteSvc,
  createProcurementSupplierSvc,
  createPurchaseRequestSvc,
  getProcurementFleetPolicyByIdSvc,
  getProcurementSupplierByIdSvc,
  listProcurementDemandConsolidationsSvc,
  listProcurementDemandsSvc,
  listProcurementFleetPoliciesSvc,
  listProcurementGoodsReceiptsSvc,
  listProcurementPurchaseOrdersSvc,
  listProcurementSupplierOptionsSvc,
  listProcurementSupplierQuotesSvc,
  listProcurementSuppliersSvc,
  listPurchaseRequestsSvc,
  rejectProcurementDemandSvc,
  rejectPurchaseRequestSvc,
  updateProcurementFleetPolicySvc,
  updateProcurementSupplierSvc,
} from './service';

function toSupplierDto(row: {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  telephone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPurchaseRequestDto(row: {
  id: string;
  requestNo: string;
  title: string;
  description: string | null;
  amountPsw: number;
  status: number;
  supplierId: string | null;
  supplierName: string | null;
  requestedByUserId: string;
  requestedByName: string | null;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  rejectionReason: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDemandDto(row: {
  id: string;
  demandNo: string;
  sourceModule: string;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  dedupeKey: string | null;
  branchId: string | null;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  estimatedUnitCostPsw: number;
  estimatedTotalPsw: number;
  urgency: number;
  neededBy: Date | null;
  status: number;
  note: string | null;
  metadataJson: string | null;
  requestedByUserId: string;
  requestedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    neededBy: row.neededBy?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toConsolidationDto(row: {
  id: string;
  companyId: string;
  consolidationNo: string;
  sourceRootLocationId: string | null;
  targetMainStoreLocationId: string | null;
  note: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toQuoteDto(row: {
  id: string;
  companyId: string;
  demandId: string;
  supplierId: string;
  quoteNo: string;
  quantity: number;
  unitCostPsw: number;
  totalCostPsw: number;
  status: number;
  note: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPurchaseOrderDto(row: {
  id: string;
  companyId: string;
  purchaseRequestId: string | null;
  supplierId: string;
  poNo: string;
  status: number;
  note: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toGoodsReceiptDto(row: {
  id: string;
  companyId: string;
  purchaseOrderId: string;
  receiptNo: string;
  note: string | null;
  receivedBy: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProcurementSuppliersCtrl(
  q: PaginationRequestDto<{ companyId: string; search?: string; isActive?: boolean }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toSupplierDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listProcurementSuppliersSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    isActive: q.filters?.isActive ?? null,
  });

  return {
    data: data.map(toSupplierDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function listProcurementSupplierOptionsCtrl(input: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  return listProcurementSupplierOptionsSvc(input);
}

export async function getProcurementSupplierByIdCtrl(input: { id: string; companyId: string }) {
  const row = await getProcurementSupplierByIdSvc(input);
  return toSupplierDto(row);
}

export async function listProcurementFleetPoliciesCtrl(input: {
  companyId: string;
  isActive?: boolean | null;
  branchId?: string | null;
}) {
  const rows = await listProcurementFleetPoliciesSvc(input);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getProcurementFleetPolicyByIdCtrl(input: { companyId: string; id: string }) {
  const row = await getProcurementFleetPolicyByIdSvc(input);
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createProcurementFleetPolicyCtrl(input: {
  companyId: string;
  actorUserId: string;
  branchId?: string | null;
  preferredSupplierId?: string | null;
  demandUrgency?: number;
  replenishMultiplier?: number;
  isActive?: boolean;
  note?: string | null;
}) {
  return createProcurementFleetPolicySvc(input);
}

export async function updateProcurementFleetPolicyCtrl(input: {
  companyId: string;
  id: string;
  actorUserId: string;
  patch: {
    preferredSupplierId?: string | null;
    demandUrgency?: number;
    replenishMultiplier?: number;
    isActive?: boolean;
    note?: string | null;
  };
}) {
  return updateProcurementFleetPolicySvc(input);
}

export async function createProcurementSupplierCtrl(input: {
  companyId: string;
  createdBy: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  telephone?: string | null;
  address?: string | null;
}) {
  return createProcurementSupplierSvc(input);
}

export async function updateProcurementSupplierCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    name?: string;
    contactPerson?: string | null;
    email?: string | null;
    telephone?: string | null;
    address?: string | null;
    isActive?: boolean;
  };
}) {
  return updateProcurementSupplierSvc(input);
}

export async function listPurchaseRequestsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    status?: number;
    supplierId?: string;
    pendingOnly?: boolean;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toPurchaseRequestDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listPurchaseRequestsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    status: q.filters?.status ?? null,
    supplierId: q.filters?.supplierId ?? null,
    pendingOnly: q.filters?.pendingOnly ?? null,
  });

  return {
    data: data.map(toPurchaseRequestDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createPurchaseRequestCtrl(input: {
  companyId: string;
  requestedByUserId: string;
  branchId?: string | null;
  supplierId?: string | null;
  title: string;
  description?: string | null;
  amountPsw: number;
}) {
  return createPurchaseRequestSvc(input);
}

export async function listProcurementDemandsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    status?: number;
    sourceModule?: string;
    branchId?: string;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toDemandDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listProcurementDemandsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    status: q.filters?.status ?? null,
    sourceModule: q.filters?.sourceModule ?? null,
    branchId: q.filters?.branchId ?? null,
  });

  return {
    data: data.map(toDemandDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createProcurementDemandCtrl(input: {
  companyId: string;
  requestedByUserId: string;
  branchId?: string | null;
  sourceModule: string;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  dedupeKey?: string | null;
  itemCode: string;
  itemName: string;
  unit?: string | null;
  quantity: number;
  estimatedUnitCostPsw?: number;
  urgency?: number;
  neededBy?: string | null;
  note?: string | null;
  metadataJson?: string | null;
}) {
  return createProcurementDemandSvc({
    ...input,
    neededBy: input.neededBy ? new Date(input.neededBy) : null,
  });
}

export async function createProcurementDemandsFromFleetLowStockCtrl(input: {
  companyId: string;
  requestedByUserId: string;
  branchId?: string | null;
  limit?: number;
  replenishMultiplier?: number;
  usePolicyRules?: boolean;
}) {
  return createProcurementDemandsFromFleetLowStockSvc(input);
}

export async function createProcurementDemandsFromInventoryLowStockCtrl(input: {
  companyId: string;
  requestedByUserId: string;
  rootLocationId?: string | null;
  targetMainStoreLocationId?: string | null;
  lowStockLimit?: number;
}) {
  return createProcurementDemandsFromInventoryLowStockSvc(input);
}

export async function consolidateProcurementDemandsCtrl(input: {
  companyId: string;
  actorUserId: string;
  demandIds: string[];
  sourceRootLocationId?: string | null;
  targetMainStoreLocationId?: string | null;
  note?: string | null;
}) {
  return consolidateProcurementDemandsSvc(input);
}

export async function listProcurementDemandConsolidationsCtrl(
  q: PaginationRequestDto<{ companyId: string }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listProcurementDemandConsolidationsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });

  return {
    data: data.map(toConsolidationDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function approveProcurementDemandCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  return approveProcurementDemandSvc(input);
}

export async function rejectProcurementDemandCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  return rejectProcurementDemandSvc(input);
}

export async function listProcurementSupplierQuotesCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    demandId?: string;
    supplierId?: string;
    status?: number;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listProcurementSupplierQuotesSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    demandId: q.filters?.demandId ?? null,
    supplierId: q.filters?.supplierId ?? null,
    status: q.filters?.status ?? null,
  });

  return {
    data: data.map(toQuoteDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createProcurementSupplierQuoteCtrl(input: {
  companyId: string;
  createdBy: string;
  demandId: string;
  supplierId: string;
  quantity: number;
  unitCostPsw: number;
  note?: string | null;
}) {
  return createProcurementSupplierQuoteSvc(input);
}

export async function acceptProcurementSupplierQuoteCtrl(input: {
  companyId: string;
  id: string;
  actorUserId: string;
}) {
  return acceptProcurementSupplierQuoteSvc(input);
}

export async function listProcurementPurchaseOrdersCtrl(
  q: PaginationRequestDto<{ companyId: string; supplierId?: string; status?: number }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listProcurementPurchaseOrdersSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    supplierId: q.filters?.supplierId ?? null,
    status: q.filters?.status ?? null,
  });

  return {
    data: data.map(toPurchaseOrderDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createProcurementPurchaseOrderFromAcceptedQuotesCtrl(input: {
  companyId: string;
  actorUserId: string;
  quoteIds: string[];
  note?: string | null;
}) {
  return createProcurementPurchaseOrderFromAcceptedQuotesSvc(input);
}

export async function listProcurementGoodsReceiptsCtrl(
  q: PaginationRequestDto<{ companyId: string; purchaseOrderId?: string }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listProcurementGoodsReceiptsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    purchaseOrderId: q.filters?.purchaseOrderId ?? null,
  });

  return {
    data: data.map(toGoodsReceiptDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createProcurementGoodsReceiptCtrl(input: {
  companyId: string;
  actorUserId: string;
  purchaseOrderId: string;
  note?: string | null;
  lines: {
    purchaseOrderItemId: string;
    receivedQuantity: number;
    locationId?: string | null;
    batchNumber?: string | null;
    supplierBatchNumber?: string | null;
    manufacturedAt?: Date | null;
    expiryDate?: Date | null;
  }[];
}) {
  return createProcurementGoodsReceiptSvc(input);
}

export async function convertProcurementDemandsToPurchaseRequestsCtrl(input: {
  companyId: string;
  actorUserId: string;
  demandIds: string[];
  supplierId?: string | null;
}) {
  return convertProcurementDemandsToPurchaseRequestsSvc(input);
}

export async function approvePurchaseRequestCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  return approvePurchaseRequestSvc(input);
}

export async function rejectPurchaseRequestCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  return rejectPurchaseRequestSvc(input);
}
