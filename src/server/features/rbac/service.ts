import { Conflict, NotFound } from '@/server/utils/http-error';
import { PermissionKeySet, type PermissionKey } from '@/shared/permissions/constants';
import { recordAuditLog } from '../audit/logger';
import {
  createRoleRepo,
  findRoleByNameRepo,
  getRoleRepo,
  listRoleOptionsRepo,
  listPermissionCatalogForCompanyRepo,
  listRolePermissionKeysRepo,
  listRolesRepo,
  setRolePermissionsRepo,
  softDeleteRoleRepo,
  updateRoleRepo,
  type ListRolesParams,
} from './repository';

export async function listRolesSvc(p: ListRolesParams) {
  return listRolesRepo(p);
}

export async function listRoleOptionsSvc(p: {
  companyId: string;
  search?: string | null;
  includeDeleted?: boolean | null;
}) {
  return listRoleOptionsRepo(p);
}

export async function getRoleSvc(id: string) {
  const role = await getRoleRepo(id);
  if (!role || role.isDeleted) throw NotFound('Role not found');
  return role;
}

export async function createRoleSvc(input: {
  companyId: string;
  name: string;
  createdBy: string;
  permissionKeys: PermissionKey[];
}) {
  const existing = await findRoleByNameRepo(input.companyId, input.name);
  if (existing && !existing.isDeleted) throw Conflict('Role name already exists');

  const created = await createRoleRepo({
    companyId: input.companyId,
    name: input.name,
    createdBy: input.createdBy,
    isDeleted: false,
  });

  if (!created?.id) throw Conflict('Unable to create role');

  await setRolePermissionsSvc({
    roleId: created.id,
    companyId: input.companyId,
    createdBy: input.createdBy,
    permissionKeys: input.permissionKeys,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'role',
    entityId: created.id,
    action: 'ROLE_CREATED',
    message: 'Role created',
    metadata: { name: input.name, permissionCount: input.permissionKeys.length },
  });

  return { id: created.id };
}

export async function updateRoleSvc(
  id: string,
  patch: { name: string; companyId: string; actorUserId?: string | null },
) {
  const role = await getRoleSvc(id);
  if (role.companyId !== patch.companyId) throw NotFound('Role not found');

  if (patch.name !== role.name) {
    const existing = await findRoleByNameRepo(role.companyId, patch.name);
    if (existing && existing.id !== id && !existing.isDeleted) throw Conflict('Role name already exists');
  }

  const updated = await updateRoleRepo(id, { name: patch.name });
  if (!updated) throw NotFound('Role not found');
  await recordAuditLog({
    companyId: patch.companyId,
    actorUserId: patch.actorUserId ?? null,
    entityType: 'role',
    entityId: id,
    action: 'ROLE_UPDATED',
    message: 'Role name updated',
    metadata: { name: patch.name },
  });
  return { id: updated.id };
}

export async function deleteRoleSvc(id: string, companyId: string, actorUserId?: string | null) {
  const role = await getRoleSvc(id);
  if (role.companyId !== companyId) throw NotFound('Role not found');
  const count = await softDeleteRoleRepo(id);
  if (!count) throw NotFound('Role not found');
  await recordAuditLog({
    companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'role',
    entityId: id,
    action: 'ROLE_DELETED',
    message: 'Role deleted',
  });
  return { success: true };
}

export async function listPermissionCatalogSvc(companyId: string, createdBy: string) {
  const _createdBy = createdBy;
  void _createdBy;
  return listPermissionCatalogForCompanyRepo(companyId);
}

export async function setRolePermissionsSvc(input: {
  roleId: string;
  companyId: string;
  createdBy: string;
  permissionKeys: PermissionKey[];
}) {
  const role = await getRoleSvc(input.roleId);
  if (role.companyId !== input.companyId) throw NotFound('Role not found');

  const validKeys = input.permissionKeys.filter((key) => PermissionKeySet.has(key)) as PermissionKey[];
  if (validKeys.length !== input.permissionKeys.length) throw Conflict('Unknown permission key(s)');

  await setRolePermissionsRepo(input.roleId, input.companyId, validKeys);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'role',
    entityId: input.roleId,
    action: 'ROLE_PERMISSIONS_UPDATED',
    message: 'Role permissions updated',
    metadata: { permissionCount: validKeys.length, permissionKeys: validKeys },
  });
  return { success: true };
}

export async function listRolePermissionKeysSvc(roleId: string, companyId: string) {
  return listRolePermissionKeysRepo(roleId, companyId);
}
