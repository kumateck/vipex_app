import { and, eq } from 'drizzle-orm';
import { branches, rolePermissions, users, UserStatus } from '@/db/schemas';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';

export type OtpApproverScope = {
  actorUserId: string;
  companyId: string;
  branchId: string;
};

export async function findOtpApprover(executor: DbExecutor, input: OtpApproverScope, lock = false) {
  const query = executor
    .select({ branchType: branches.type })
    .from(users)
    .innerJoin(
      branches,
      and(eq(branches.id, users.branchId), eq(branches.companyId, users.companyId)),
    )
    .innerJoin(
      rolePermissions,
      and(eq(rolePermissions.roleId, users.roleId), eq(rolePermissions.companyId, users.companyId)),
    )
    .where(
      and(
        eq(users.id, input.actorUserId),
        eq(users.companyId, input.companyId),
        eq(users.branchId, input.branchId),
        eq(users.status, UserStatus.ACTIVE),
        eq(branches.isDeleted, false),
        eq(rolePermissions.permission, PermissionKeys.CanAuthorizePickupWithoutOtp),
      ),
    )
    .limit(1);
  const [grant] = await (lock ? query.for('share') : query);
  return grant;
}
