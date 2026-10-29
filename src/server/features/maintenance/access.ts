import { getUserByIdRepo } from '@/server/features/auth/repository';
import { assertSystemAdminRoleSvc } from '@/server/features/rbac/service';
import type { AuthUser } from '@/server/plugins/auth';
import { UserStatus } from '@/db/schemas/enums';
import { Forbidden, Unauthorized } from '@/server/utils/http-error';

export async function assertMaintenanceAdmin(
  user: AuthUser | null,
  deps = {
    loadUser: getUserByIdRepo,
    assertRole: assertSystemAdminRoleSvc,
  },
) {
  if (!user) throw Unauthorized();
  const current = await deps.loadUser(user.sub);
  if (
    !current ||
    current.status !== UserStatus.ACTIVE ||
    !user.companyId ||
    current.companyId !== user.companyId
  ) {
    throw Forbidden('Only an active System Admin can use maintenance scripts');
  }
  await deps.assertRole({ companyId: current.companyId, roleId: current.roleId });
  return { actorId: current.id, companyId: current.companyId };
}
