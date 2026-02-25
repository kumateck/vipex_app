import { and, asc, count, eq, ilike, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { permissions, rolePermissions, roles } from '@/db/schemas';
import { PermissionCatalog, type PermissionKey } from '@/shared/permissions/constants';

export type ListRolesParams = {
  limit: number;
  offset: number;
  companyId: string;
  search?: string | null;
  includeDeleted?: boolean | null;
};

export type RoleOptionRow = {
  id: string;
  name: string;
};

export async function listRolesRepo(p: ListRolesParams) {
  const where = [
    eq(roles.companyId, p.companyId),
    ...(p.includeDeleted ? [] : [eq(roles.isDeleted, false)]),
    ...(p.search ? [ilike(roles.name, `%${p.search}%`)] : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(roles)
    .where(and(...where));
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select({
      id: roles.id,
      companyId: roles.companyId,
      name: roles.name,
      isDeleted: roles.isDeleted,
      createdBy: roles.createdBy,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt,
    })
    .from(roles)
    .where(and(...where))
    .orderBy(asc(roles.name), asc(roles.id))
    .limit(p.limit)
    .offset(p.offset);

  if (!rows.length) return { data: rows, totalRecords, permissionsByRole: new Map<string, string[]>() };

  const roleIds = rows.map((r) => r.id);
  const grants = await db
    .select({
      roleId: rolePermissions.roleId,
      key: permissions.permission,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(and(eq(rolePermissions.companyId, p.companyId), inArray(rolePermissions.roleId, roleIds)));

  const permissionsByRole = new Map<string, string[]>();
  for (const grant of grants) {
    const current = permissionsByRole.get(grant.roleId) ?? [];
    current.push(grant.key);
    permissionsByRole.set(grant.roleId, current);
  }

  return { data: rows, totalRecords, permissionsByRole };
}

export async function listRoleOptionsRepo(p: {
  companyId: string;
  search?: string | null;
  includeDeleted?: boolean | null;
}): Promise<RoleOptionRow[]> {
  const where = [
    eq(roles.companyId, p.companyId),
    ...(p.includeDeleted ? [] : [eq(roles.isDeleted, false)]),
    ...(p.search ? [ilike(roles.name, `%${p.search}%`)] : []),
  ];

  return db
    .select({
      id: roles.id,
      name: roles.name,
    })
    .from(roles)
    .where(and(...where))
    .orderBy(asc(roles.name), asc(roles.id));
}

export async function getRoleRepo(id: string) {
  const [row] = await db
    .select({
      id: roles.id,
      companyId: roles.companyId,
      name: roles.name,
      isDeleted: roles.isDeleted,
      createdBy: roles.createdBy,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt,
    })
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);
  return row ?? null;
}

export async function createRoleRepo(values: typeof roles.$inferInsert) {
  const [row] = await db.insert(roles).values(values).returning({ id: roles.id });
  return row ?? null;
}

export async function updateRoleRepo(id: string, patch: Pick<typeof roles.$inferInsert, 'name'>) {
  const [row] = await db
    .update(roles)
    .set(patch)
    .where(eq(roles.id, id))
    .returning({ id: roles.id });
  return row ?? null;
}

export async function softDeleteRoleRepo(id: string) {
  const rows = await db
    .update(roles)
    .set({ isDeleted: true })
    .where(eq(roles.id, id))
    .returning({ id: roles.id });
  return rows.length;
}

export async function findRoleByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: roles.id, isDeleted: roles.isDeleted })
    .from(roles)
    .where(and(eq(roles.companyId, companyId), ilike(roles.name, name)))
    .limit(1);
  return row ?? null;
}

export async function ensurePermissionCatalogRepo(companyId: string, createdBy: string) {
  const keys = PermissionCatalog.map((p) => p.key);
  const existing = await db
    .select({ id: permissions.id, key: permissions.permission })
    .from(permissions)
    .where(and(eq(permissions.companyId, companyId), inArray(permissions.permission, keys)));

  const existingByKey = new Map(existing.map((row) => [row.key, row.id]));
  const missing = PermissionCatalog.filter((entry) => !existingByKey.has(entry.key));

  if (missing.length) {
    const inserted = await db
      .insert(permissions)
      .values(
        missing.map((entry) => ({
          companyId,
          permission: entry.key,
          description: entry.description,
          permType: entry.group,
          permParent: entry.group,
          createdBy,
          isDeleted: false,
        })),
      )
      .returning({ id: permissions.id, key: permissions.permission });

    for (const row of inserted) existingByKey.set(row.key, row.id);
  }

  return existingByKey;
}

export async function setRolePermissionsRepo(roleId: string, companyId: string, permissionIds: string[]) {
  await db.transaction(async (tx) => {
    await tx
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.companyId, companyId)));

    if (!permissionIds.length) return;

    await tx.insert(rolePermissions).values(
      permissionIds.map((permissionId) => ({
        roleId,
        companyId,
        permissionId,
      })),
    );
  });
}

export async function listPermissionCatalogForCompanyRepo(companyId: string) {
  const rows = await db
    .select({
      id: permissions.id,
      key: permissions.permission,
      description: permissions.description,
      group: permissions.permType,
    })
    .from(permissions)
    .where(and(eq(permissions.companyId, companyId), eq(permissions.isDeleted, false)))
    .orderBy(asc(permissions.permType), asc(permissions.permission));

  return rows;
}

export async function listRolePermissionKeysRepo(roleId: string, companyId: string): Promise<PermissionKey[]> {
  const rows = await db
    .select({ key: permissions.permission })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.companyId, companyId)));

  return rows.map((row) => row.key as PermissionKey);
}
