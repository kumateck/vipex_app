import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto, PaginatedResponseDto } from '@/server/types/pagination.types';
import {
  createWarehouseSvc,
  deleteWarehouseSvc,
  getWarehouseSvc,
  listWarehouseOptionsSvc,
  listWarehousesSvc,
  updateWarehouseSvc,
} from './service';

function toWarehouseDto(row: {
  id: string;
  companyId: string;
  branchId: string;
  branch?: { id: string; name: string } | null;
  name: string;
  description?: string | null;
  active: boolean;
  isDeleted: boolean;
  createdBy: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}) {
  return {
    ...row,
    createdAt:
      row.createdAt && typeof row.createdAt !== 'string'
        ? row.createdAt.toISOString()
        : (row.createdAt ?? null),
    updatedAt:
      row.updatedAt && typeof row.updatedAt !== 'string'
        ? row.updatedAt.toISOString()
        : (row.updatedAt ?? null),
  };
}

export async function listWarehousesCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    branchId?: string | null;
    includeDeleted?: boolean | null;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toWarehouseDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listWarehousesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    branchId: q.filters?.branchId ?? null,
    includeDeleted: q.filters?.includeDeleted ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map(toWarehouseDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getWarehouseByIdCtrl(id: string) {
  return toWarehouseDto(await getWarehouseSvc(id));
}

export async function listWarehouseOptionsCtrl(filters: {
  companyId?: string | null;
  branchId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
  activeOnly?: boolean | null;
}) {
  return listWarehouseOptionsSvc(filters);
}

export const createWarehouseCtrl = createWarehouseSvc;
export const updateWarehouseCtrl = updateWarehouseSvc;
export const deleteWarehouseCtrl = deleteWarehouseSvc;
