import { BranchType } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import { Forbidden } from '@/server/utils/http-error';

export function clearanceScope(user: AuthUser) {
  if (!user.companyId || (!user.branchId && user.branchType !== BranchType.HEADOFFICE))
    throw Forbidden();
  return {
    companyId: user.companyId,
    branchId: user.branchType === BranchType.HEADOFFICE ? null : user.branchId,
  };
}
