import { Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import {
  normalizePermissionKeys,
  PermissionKeySet,
  type PermissionKey,
} from '@/shared/permissions/constants';
import { recordAuditLog } from '../audit/logger';
import {
  createRoleRepo,
  findRoleByNameRepo,
  getRoleRepo,
  listRoleOptionsRepo,
  listPermissionCatalogForCompanyRepo,
  listRolePermissionKeysRepo,
  listRolesRepo,
  restoreRoleRepo,
  setRolePermissionsRepo,
  softDeleteRoleRepo,
  updateRoleRepo,
  type ListRolesParams,
} from './repository';

const SYSTEM_ADMIN_ROLE_NAME = 'system admin';

function isSystemAdminRole(role: Awaited<ReturnType<typeof getRoleRepo>>, companyId: string) {
  return (
    role?.companyId === companyId &&
    !role.isDeleted &&
    role.name.trim().toLowerCase() === SYSTEM_ADMIN_ROLE_NAME
  );
}

export async function listRolesSvc(p: ListRolesParams) {
  const result = await listRolesRepo(p);
  const normalizedPermissionsByRole = new Map<string, string[]>();
  for (const [roleId, permissions] of result.permissionsByRole.entries()) {
    normalizedPermissionsByRole.set(roleId, normalizePermissionKeys(permissions));
  }
  return { ...result, permissionsByRole: normalizedPermissionsByRole };
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
  actorPermissions: string[];
  actorRoleId?: string | null;
}) {
  const existing = await findRoleByNameRepo(input.companyId, input.name);
  if (existing && !existing.isDeleted) throw Conflict('Role name already exists');

  if (existing && existing.isDeleted) {
    const restored = await restoreRoleRepo(existing.id, {
      name: input.name,
    });

    if (!restored?.id) throw Conflict('Unable to restore role');

    await setRolePermissionsSvc({
      roleId: restored.id,
      companyId: input.companyId,
      createdBy: input.createdBy,
      permissionKeys: input.permissionKeys,
      actorPermissions: input.actorPermissions,
      actorRoleId: input.actorRoleId,
    });

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.createdBy,
      entityType: 'role',
      entityId: restored.id,
      action: 'ROLE_RESTORED',
      message: 'Role restored from deleted state',
      metadata: { name: input.name, permissionCount: input.permissionKeys.length },
    });

    return { id: restored.id };
  }

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
    actorPermissions: input.actorPermissions,
    actorRoleId: input.actorRoleId,
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
    if (existing && existing.id !== id && !existing.isDeleted)
      throw Conflict('Role name already exists');
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
  actorPermissions: string[];
  actorRoleId?: string | null;
}) {
  const role = await getRoleSvc(input.roleId);
  if (role.companyId !== input.companyId) throw NotFound('Role not found');

  const unknownKeys = input.permissionKeys.filter(
    (key) => !PermissionKeySet.has(key) && normalizePermissionKeys([key]).length === 0,
  );
  if (unknownKeys.length > 0) throw Conflict('Unknown permission key(s)');

  const normalizedKeys = normalizePermissionKeys(input.permissionKeys);

  // Permission managers remain bounded by their own grants. The canonical System Admin
  // role is the trusted bootstrap authority for catalog permissions introduced by a
  // production deployment, when no role can hold the new permission yet.
  const [existingPermissionKeys, actorRole] = await Promise.all([
    listRolePermissionKeysRepo(input.roleId, input.companyId),
    input.actorRoleId ? getRoleRepo(input.actorRoleId) : Promise.resolve(null),
  ]);
  const existingKeys = new Set(existingPermissionKeys);
  const actorGranted = new Set(normalizePermissionKeys(input.actorPermissions));
  const canBootstrapPermissions = isSystemAdminRole(actorRole, input.companyId);
  const escalatedKeys = canBootstrapPermissions
    ? []
    : normalizedKeys.filter((key) => !existingKeys.has(key) && !actorGranted.has(key));
  if (escalatedKeys.length > 0) {
    throw Forbidden(`Cannot grant permission(s) you do not hold: ${escalatedKeys.join(', ')}`);
  }

  await setRolePermissionsRepo(input.roleId, input.companyId, normalizedKeys);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'role',
    entityId: input.roleId,
    action: 'ROLE_PERMISSIONS_UPDATED',
    message: 'Role permissions updated',
    metadata: {
      permissionCount: normalizedKeys.length,
      permissionKeys: normalizedKeys,
      bootstrappedBySystemAdmin: canBootstrapPermissions,
    },
  });
  return { success: true };
}

export async function listRolePermissionKeysSvc(roleId: string, companyId: string) {
  return normalizePermissionKeys(await listRolePermissionKeysRepo(roleId, companyId));
}
