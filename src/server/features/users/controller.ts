import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import { createUserSvc, getUserSvc, listUsersSvc, updateUserSvc } from './service';

// Normalize DB row to API DTO
function toUserDto(u: {
  id: string;
  fullname: string;
  telephone: string;
  email: string;
  status: number;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  roleName?: string | null;
  branchName?: string | null;
  companyName?: string | null;
}) {
  return {
    id: u.id,
    fullname: u.fullname,
    telephone: u.telephone,
    email: u.email,
    status: u.status,
    roleId: u.roleId,
    companyId: u.companyId,
    branchId: u.branchId,
    createdBy: u.createdBy,
    createdAt:
      u.createdAt && typeof u.createdAt !== 'string'
        ? u.createdAt.toISOString()
        : (u.createdAt ?? null),
    updatedAt:
      u.updatedAt && typeof u.updatedAt !== 'string'
        ? u.updatedAt.toISOString()
        : (u.updatedAt ?? null),
    roleName: u.roleName ?? null,
    branchName: u.branchName ?? null,
    companyName: u.companyName ?? null,
  };
}

export async function listUsersCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    branchId?: string | null;
    roleId?: string | null;
    status?: number | null;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toUserDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });

  const { data, totalRecords } = await listUsersSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    branchId: q.filters?.branchId ?? null,
    roleId: q.filters?.roleId ?? null,
    status: q.filters?.status ?? null,
    search: pagination.search ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map(toUserDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getUserByIdCtrl(id: string) {
  const u = await getUserSvc(id);
  return toUserDto(u);
}

export async function createUserCtrl(input: {
  fullname: string;
  telephone: string;
  email: string;
  status?: number;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
}) {
  return createUserSvc(input);
}

export async function updateUserCtrl(
  id: string,
  patch: {
    fullname?: string;
    telephone?: string;
    email?: string;
    status?: number;
    roleId?: string;
    branchId?: string;
  },
) {
  return updateUserSvc(id, patch);
}
