import { and, asc, eq, exists, ne, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { branches, locations, rolePermissions, roles, users } from '@/db/schemas';
import { BranchType, UserStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';

const home = alias(branches, 'home_branch');

export async function getBranchSwitchAccountRepo(userId: string) {
  const [account] = await db
    .select({
      companyId: users.companyId,
      roleId: users.roleId,
      branchId: users.branchId,
      branchType: home.type,
      locationId: users.locationId,
    })
    .from(users)
    .innerJoin(home, and(eq(home.id, users.branchId), eq(home.companyId, users.companyId)))
    .innerJoin(roles, and(eq(roles.id, users.roleId), eq(roles.companyId, users.companyId)))
    .where(
      and(
        eq(users.id, userId),
        eq(users.status, UserStatus.ACTIVE),
        eq(roles.isDeleted, false),
        exists(
          db
            .select({ id: rolePermissions.id })
            .from(rolePermissions)
            .where(
              and(
                eq(rolePermissions.roleId, users.roleId),
                eq(rolePermissions.companyId, users.companyId),
                eq(rolePermissions.permission, PermissionKeys.CanSwitchBranch),
              ),
            ),
        ),
      ),
    )
    .limit(1);
  return account ?? null;
}

export type BranchSwitchAccount = NonNullable<
  Awaited<ReturnType<typeof getBranchSwitchAccountRepo>>
>;

export function listBranchSwitchChoicesRepo(account: BranchSwitchAccount, branchId?: string) {
  return db
    .select({
      branch: { id: branches.id, name: branches.name, type: branches.type },
      location: { id: locations.id, name: locations.name },
    })
    .from(branches)
    .leftJoin(
      locations,
      and(
        eq(locations.branchId, branches.id),
        eq(locations.companyId, branches.companyId),
        eq(locations.isDeleted, false),
        account.locationId
          ? or(ne(branches.id, account.branchId), eq(locations.id, account.locationId))
          : ne(branches.id, account.branchId),
      ),
    )
    .where(
      and(
        eq(branches.companyId, account.companyId),
        eq(branches.isDeleted, false),
        branchId ? eq(branches.id, branchId) : undefined,
        account.branchType === BranchType.HEADOFFICE
          ? undefined
          : ne(branches.type, BranchType.HEADOFFICE),
      ),
    )
    .orderBy(asc(branches.name), asc(locations.name));
}
