import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto, PaginatedResponseDto } from '@/server/types/pagination.types';
import {
  approvePurchaseRequestSvc,
  createProcurementSupplierSvc,
  createPurchaseRequestSvc,
  listProcurementSupplierOptionsSvc,
  listProcurementSuppliersSvc,
  listPurchaseRequestsSvc,
  rejectPurchaseRequestSvc,
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
