import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';

import {
  createStatusSvc,
  deleteStatusSvc,
  getStatusSvc,
  listStatusOptionsSvc,
  listStatusesSvc,
  updateStatusSvc,
} from './service';

// Normalize DB row to API DTO
function toStatusDto(s: {
  id: string;
  companyId: string;
  name: string;
  color: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}) {
  return {
    id: s.id,
    companyId: s.companyId,
    name: s.name,
    color: s.color,
    isDeleted: !!s.isDeleted,
    createdBy: s.createdBy,
    createdAt:
      s.createdAt && typeof s.createdAt !== 'string'
        ? s.createdAt.toISOString()
        : (s.createdAt ?? null),
    updatedAt:
      s.updatedAt && typeof s.updatedAt !== 'string'
        ? s.updatedAt.toISOString()
        : (s.updatedAt ?? null),
  };
}

export async function listStatusesCtrl(
  q: PaginationRequestDto<{ companyId?: string | null; includeDeleted?: boolean | null }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toStatusDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });

  const { data, totalRecords } = await listStatusesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    includeDeleted: q.filters?.includeDeleted ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map(toStatusDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getStatusByIdCtrl(id: string) {
  const s = await getStatusSvc(id);
  return toStatusDto(s);
}

export async function listStatusOptionsCtrl(filters: {
  companyId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
}) {
  const rows = await listStatusOptionsSvc(filters);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
  }));
}

export async function createStatusCtrl(input: {
  companyId: string;
  name: string;
  color: string;
  createdBy: string;
}) {
  return createStatusSvc(input);
}

export async function updateStatusCtrl(id: string, patch: { name?: string; color?: string }) {
  return updateStatusSvc(id, patch);
}

export async function deleteStatusCtrl(id: string) {
  return deleteStatusSvc(id);
}
