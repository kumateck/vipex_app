import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import { UserType, type CashierType } from '@/db/schemas/enums';
import {
  createUserSvc,
  getUserSvc,
  listUserOptionsSvc,
  listUsersSvc,
  updateUserSvc,
} from './service';

// Normalize DB row to API DTO
function toUserDto(u: {
  id: string;
  fullname: string;
  telephone: string;
  email: string;
  status: number;
  roleId: string;
  companyId: string;
  employeeId?: string | null;
  employeeName?: string | null;
  employeeNumber?: string | null;
  branchId: string;
  locationId?: string | null;
  locationName?: string | null;
  userType?: number | null;
  cashierType?: CashierType | null;
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
    employeeId: u.employeeId ?? null,
    employeeName: u.employeeName ?? null,
    employeeNumber: u.employeeNumber ?? null,
    branchId: u.branchId,
    locationId: u.locationId ?? null,
    locationName: u.locationName ?? null,
    userType: u.userType ?? UserType.STAFF,
    cashierType: (u.cashierType as CashierType | null | undefined) ?? null,
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
    locationId?: string | null;
    roleId?: string | null;
    userType?: number | null;
    status?: number | null;
    statuses?: string | null;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toUserDto>>> {
  const parsedStatuses = q.filters?.statuses
    ?.split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value));
  const pagination = normalizePagination(q, { pageSize: 20 });

  const { data, totalRecords } = await listUsersSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    branchId: q.filters?.branchId ?? null,
    locationId: q.filters?.locationId ?? null,
    roleId: q.filters?.roleId ?? null,
    userType: q.filters?.userType ?? null,
    status: q.filters?.status ?? null,
    statuses: parsedStatuses?.length ? parsedStatuses : null,
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

export async function listUserOptionsCtrl(filters: {
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  roleId?: string | null;
  userType?: number | null;
  status?: number | null;
  search?: string | null;
}) {
  return listUserOptionsSvc(filters);
}

export async function createUserCtrl(input: {
  fullname: string;
  telephone: string;
  email: string;
  employeeId?: string | null;
  status?: number;
  roleId: string;
  companyId: string;
  branchId: string;
  locationId?: string | null;
  userType: number;
  cashierType?: CashierType | null;
  createdBy: string;
  actor: {
    companyId?: string | null;
    branchId?: string | null;
    branchType?: number | null;
    locationId?: string | null;
  };
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
    locationId?: string | null;
    userType?: number;
    cashierType?: CashierType | null;
  },
) {
  return updateUserSvc(id, patch);
}
