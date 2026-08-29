import { PermissionKeys, ReportPermissionKeys } from './constants';
import { inferRequiredPermissionByPath } from './path-access-required';

export { inferReadPermissionByPath } from './path-access-read';
export { inferRequiredPermissionByPath } from './path-access-required';

export function hasRequiredPermissionForPath(
  pathname: string | undefined,
  grantedPermissions: Iterable<string>,
) {
  const requiredPermission = inferRequiredPermissionByPath(pathname);
  if (!requiredPermission) return true;

  const granted = new Set(grantedPermissions);
  if (requiredPermission === PermissionKeys.CanReadReportsHub) {
    return ReportPermissionKeys.some((permissionKey) => granted.has(permissionKey));
  }
  if (requiredPermission === PermissionKeys.CanPrintSelfServiceQrCode) {
    return (
      granted.has(PermissionKeys.CanPrintSelfServiceQrCode) ||
      granted.has(PermissionKeys.CanUpdateBranches)
    );
  }

  return granted.has(requiredPermission);
}
