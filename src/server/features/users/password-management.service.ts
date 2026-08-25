import { UserStatus } from '@/db/schemas/enums';
import { setUserPasswordAndRevokeSessionsRepo } from '@/server/features/auth/repository';
import { recordAuditLog } from '@/server/features/audit/logger';
import { assertSystemAdminRoleSvc } from '@/server/features/rbac/service';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import { hashPassword } from '@/server/utils/password';
import { getUserRepo } from './repository';
import { listUserPasswordTargetsRepo } from './password-management.repository';

export async function listUserPasswordTargetsSvc(input: {
  companyId: string;
  actorUserId: string;
  actorRoleId?: string | null;
}) {
  await assertSystemAdminRoleSvc({ companyId: input.companyId, roleId: input.actorRoleId });
  return listUserPasswordTargetsRepo(input);
}

export async function setUserPasswordSvc(input: {
  targetUserId: string;
  newPassword: string;
  actorUserId: string;
  actorCompanyId: string;
  actorRoleId?: string | null;
}) {
  await assertSystemAdminRoleSvc({
    companyId: input.actorCompanyId,
    roleId: input.actorRoleId,
  });
  if (input.targetUserId === input.actorUserId) {
    throw BadRequest('Use Change Password to update your own password');
  }

  const target = await getUserRepo(input.targetUserId);
  if (!target || target.companyId !== input.actorCompanyId) throw NotFound('User not found');
  if (target.status === UserStatus.INVITED || target.status === UserStatus.REMOVED) {
    throw BadRequest('Password cannot be set for this user status');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await setUserPasswordAndRevokeSessionsRepo(target.id, passwordHash);
  await recordAuditLog({
    companyId: input.actorCompanyId,
    actorUserId: input.actorUserId,
    entityType: 'user',
    entityId: target.id,
    action: 'USER_PASSWORD_SET_BY_SYSTEM_ADMIN',
    message: 'User password set by System Admin; active sessions revoked',
    metadata: { targetEmail: target.email },
  });
  return { success: true };
}
