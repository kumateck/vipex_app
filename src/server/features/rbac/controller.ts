import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import type { PermissionKey } from '@/shared/permissions/constants';
import {
  createRoleSvc,
  deleteRoleSvc,
  listPermissionCatalogSvc,
  listRoleOptionsSvc,
  listRolePermissionKeysSvc,
  listRolesSvc,
  setRolePermissionsSvc,
  updateRoleSvc,
} from './service';

function toRoleDto(role: {
  id: string;
  companyId: string;
  name: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}) {
  return {
    id: role.id,
    companyId: role.companyId,
    name: role.name,
    isDeleted: role.isDeleted,
    createdBy: role.createdBy,
    createdAt:
      role.createdAt && typeof role.createdAt !== 'string'
        ? role.createdAt.toISOString()
        : (role.createdAt ?? null),
    updatedAt:
      role.updatedAt && typeof role.updatedAt !== 'string'
        ? role.updatedAt.toISOString()
        : (role.updatedAt ?? null),
  };
}

export async function listRolesCtrl(
  q: PaginationRequestDto<{ companyId: string; includeDeleted?: boolean | null }>,
) {
  const filters = q.filters;
  if (!filters?.companyId) {
    throw new Error('companyId is required');
  }

  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords, permissionsByRole } = await listRolesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: filters.companyId,
    search: pagination.search ?? null,
    includeDeleted: filters.includeDeleted ?? null,
  });

  const rows = data.map((role) => ({
    ...toRoleDto(role),
    permissions: permissionsByRole.get(role.id) ?? [],
  }));

  return {
    data: rows,
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  } satisfies PaginatedResponseDto<(typeof rows)[number]>;
}

export async function createRoleCtrl(input: {
  companyId: string;
  createdBy: string;
  name: string;
  permissionKeys: PermissionKey[];
}) {
  return createRoleSvc(input);
}

export async function listRoleOptionsCtrl(filters: {
  companyId: string;
  search?: string | null;
  includeDeleted?: boolean | null;
}) {
  return listRoleOptionsSvc(filters);
}

export async function updateRoleCtrl(
  id: string,
  companyId: string,
  body: { name: string },
  actorUserId?: string | null,
) {
  return updateRoleSvc(id, { companyId, name: body.name, actorUserId });
}

export async function deleteRoleCtrl(id: string, companyId: string, actorUserId?: string | null) {
  return deleteRoleSvc(id, companyId, actorUserId);
}

export async function listPermissionsCtrl(companyId: string, createdBy: string) {
  return {
    data: await listPermissionCatalogSvc(companyId, createdBy),
  };
}

export async function setRolePermissionsCtrl(input: {
  roleId: string;
  companyId: string;
  createdBy: string;
  permissionKeys: PermissionKey[];
}) {
  return setRolePermissionsSvc(input);
}

export async function getRolePermissionsCtrl(roleId: string, companyId: string) {
  return { permissionKeys: await listRolePermissionKeysSvc(roleId, companyId) };
}
