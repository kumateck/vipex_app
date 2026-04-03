import 'dotenv/config';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../src/db/config';
import { rolePermissions, roles } from '@/db/schemas';
import { PermissionCatalog } from '@/shared/permissions/constants';

const ROLE_NAME = 'System Admin';

async function main() {
  const permissionKeys = PermissionCatalog.map((permission) => permission.key);

  const systemAdminRoles = await db
    .select({
      roleId: roles.id,
      companyId: roles.companyId,
      roleName: roles.name,
    })
    .from(roles)
    .where(and(eq(roles.isDeleted, false), sql`lower(${roles.name}) = lower(${ROLE_NAME})`));

  if (!systemAdminRoles.length) {
    console.log(`No '${ROLE_NAME}' roles found. Nothing to backfill.`);
    return;
  }

  let totalInserted = 0;

  for (const role of systemAdminRoles) {
    const existingPermissions = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(
        and(eq(rolePermissions.companyId, role.companyId), eq(rolePermissions.roleId, role.roleId)),
      );

    const existingSet = new Set(existingPermissions.map((row) => row.permission));
    const missing = permissionKeys.filter((key) => !existingSet.has(key));

    if (!missing.length) {
      continue;
    }

    await db.insert(rolePermissions).values(
      missing.map((permission) => ({
        roleId: role.roleId,
        companyId: role.companyId,
        permission,
      })),
    );

    totalInserted += missing.length;
    console.log(
      `Backfilled ${missing.length} permissions for company ${role.companyId} role ${role.roleId} (${role.roleName}).`,
    );
  }

  if (!totalInserted) {
    console.log('All System Admin roles are already up to date.');
    return;
  }

  console.log(`Done. Inserted ${totalInserted} missing role permission rows.`);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
