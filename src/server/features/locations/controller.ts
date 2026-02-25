import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import {
  createLocationSvc,
  deleteLocationSvc,
  getLocationSvc,
  listLocationsSvc,
  updateLocationSvc,
} from './service';

// Normalize DB row to API DTO
function toLocationDto(l: {
  id: string;
  companyId: string;
  branchId: string;
  branch: { id: string | null; name: string | null } | null;
  name: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}) {
  return {
    id: l.id,
    companyId: l.companyId,
    branchId: l.branchId,
    branch: l.branch?.id && l.branch?.name ? { id: l.branch.id, name: l.branch.name } : null,
    name: l.name,
    isDeleted: !!l.isDeleted,
    createdBy: l.createdBy,
    createdAt:
      l.createdAt && typeof l.createdAt !== 'string'
        ? l.createdAt.toISOString()
        : (l.createdAt ?? null),
    updatedAt:
      l.updatedAt && typeof l.updatedAt !== 'string'
        ? l.updatedAt.toISOString()
        : (l.updatedAt ?? null),
  };
}

export async function listLocationsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    branchId?: string | null;
    includeDeleted?: boolean | null;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toLocationDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });

  const { data, totalRecords } = await listLocationsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    branchId: q.filters?.branchId ?? null,
    includeDeleted: q.filters?.includeDeleted ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map(toLocationDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getLocationByIdCtrl(id: string) {
  const l = await getLocationSvc(id);
  return toLocationDto(l);
}

export async function createLocationCtrl(input: {
  companyId: string;
  branchId: string;
  name: string;
  createdBy: string;
}) {
  return createLocationSvc(input);
}

export async function updateLocationCtrl(id: string, patch: { name?: string }) {
  return updateLocationSvc(id, patch);
}

export async function deleteLocationCtrl(id: string) {
  return deleteLocationSvc(id);
}
