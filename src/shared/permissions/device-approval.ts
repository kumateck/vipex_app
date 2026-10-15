import { BranchType } from '@/db/schemas/enums';
import { PermissionKeys } from './constants';

// Who may approve, revoke or block registered mobile/desktop devices.
// CanApproveRegisteredDevices is the dedicated permission. Head-office users with
// CanUpdateUsers keep access as a temporary fallback until roles are migrated.
export function canApproveRegisteredDevices(input: {
  permissions: readonly string[] | undefined;
  branchType: number | null | undefined;
}) {
  const granted = new Set(input.permissions ?? []);
  if (granted.has(PermissionKeys.CanApproveRegisteredDevices)) return true;
  return input.branchType === BranchType.HEADOFFICE && granted.has(PermissionKeys.CanUpdateUsers);
}
