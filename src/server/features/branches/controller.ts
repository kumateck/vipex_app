import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto, PaginatedResponseDto } from '@/server/types/pagination.types';
import {
  createBranchSvc,
  deleteBranchSvc,
  getBranchSvc,
  listBranchesSvc,
  updateBranchSvc,
} from './service';

// Shape returned to clients
function toBranchDto(b: {
  id: string;
  companyId: string;
  name: string;
  type: string;
  telephone: string | null;
  address: string | null;
  email: string | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}) {
  return {
    id: b.id,
    companyId: b.companyId,
    name: b.name,
    type: b.type,
    telephone: b.telephone ?? null,
    address: b.address ?? null,
    email: b.email ?? null,
    isDeleted: !!b.isDeleted,
    createdBy: b.createdBy,
    createdAt:
      b.createdAt && typeof b.createdAt !== 'string'
        ? b.createdAt.toISOString()
        : (b.createdAt ?? null),
    updatedAt:
      b.updatedAt && typeof b.updatedAt !== 'string'
        ? b.updatedAt.toISOString()
        : (b.updatedAt ?? null),
  };
}

export async function listBranchesCtrl(
  q: PaginationRequestDto<{ companyId?: string | null }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toBranchDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });

  const { data, totalRecords } = await listBranchesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map(toBranchDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getBranchByIdCtrl(id: string) {
  const b = await getBranchSvc(id);
  return toBranchDto(b);
}

export async function createBranchCtrl(input: {
  companyId: string;
  name: string;
  type: string;
  telephone?: string | null;
  address?: string | null;
  email?: string | null;
  createdBy: string;
}) {
  return createBranchSvc(input);
}

export async function updateBranchCtrl(
  id: string,
  patch: {
    name?: string;
    type?: string;
    telephone?: string | null;
    address?: string | null;
    email?: string | null;
  },
) {
  return updateBranchSvc(id, patch);
}

export async function deleteBranchCtrl(id: string) {
  return deleteBranchSvc(id);
}
