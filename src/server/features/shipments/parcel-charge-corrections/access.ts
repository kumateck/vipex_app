import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { rolePermissions, roles, users } from '@/db/schemas';
import { Forbidden } from '@/server/utils/http-error';
import type { CorrectionTx } from './policy';

/** Recheck live role grants even if a native session carries an older permission snapshot. */
export async function assertChargePermission(
  companyId: string,
  actorUserId: string,
  permissions: readonly string[],
  executor: typeof db | CorrectionTx = db,
) {
  const [grant] = await executor
    .select({ id: users.id })
    .from(users)
    .innerJoin(
      roles,
      and(
        eq(roles.id, users.roleId),
        eq(roles.companyId, users.companyId),
        eq(roles.isDeleted, false),
      ),
    )
    .innerJoin(
      rolePermissions,
      and(
        eq(rolePermissions.roleId, roles.id),
        eq(rolePermissions.companyId, companyId),
        inArray(rolePermissions.permission, [...permissions]),
      ),
    )
    .where(and(eq(users.id, actorUserId), eq(users.companyId, companyId), eq(users.status, 0)))
    .limit(1);
  if (!grant)
    throw Forbidden(
      'An active staff account with the required parcel charge permission is required',
    );
}
