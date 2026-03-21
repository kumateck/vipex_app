import { and, asc, count, eq, ilike, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { rolePermissions, roles } from '@/db/schemas';
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
      key: rolePermissions.permission,
    })
    .from(rolePermissions)
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

export async function setRolePermissionsRepo(
  roleId: string,
  companyId: string,
  permissionKeys: PermissionKey[],
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.companyId, companyId)));

    if (!permissionKeys.length) return;

    await tx.insert(rolePermissions).values(
      permissionKeys.map((permission) => ({
        roleId,
        companyId,
        permission,
      })),
    );
  });
}

export async function listPermissionCatalogForCompanyRepo(_companyId: string) {
  return PermissionCatalog;
}

export async function listRolePermissionKeysRepo(roleId: string, companyId: string): Promise<PermissionKey[]> {
  const rows = await db
    .select({ key: rolePermissions.permission })
    .from(rolePermissions)
    .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.companyId, companyId)));

  return rows.map((row) => row.key as PermissionKey);
}
