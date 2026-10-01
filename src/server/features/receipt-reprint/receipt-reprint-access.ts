import { BranchType } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';

export function canReadReceiptReprintTax(
  user: AuthUser,
  parcel: { companyId: string; sourceId: string },
) {
  if (!user.companyId || parcel.companyId !== user.companyId) return false;
  return (
    user.permissions?.includes(PermissionKeys.CanReadParcels) === true ||
    user.branchType === BranchType.HEADOFFICE ||
    user.branchId === parcel.sourceId
  );
}
