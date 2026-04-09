import { PermissionKeys } from '@/shared/permissions/constants';
import type { AnalyticsPermissionKey } from './types';

export const ANALYTICS_PERMISSION_KEYS = {
  basic: PermissionKeys.view_basic_analytics,
  operational: PermissionKeys.view_operational_analytics,
  financial: PermissionKeys.view_financial_analytics,
  branch: PermissionKeys.view_branch_analytics,
  global: PermissionKeys.view_global_analytics,
  personal: PermissionKeys.view_personal_analytics,
} as const satisfies Record<string, AnalyticsPermissionKey>;

export function hasAnalyticsPermission(
  permissions: readonly string[] | undefined,
  permission: AnalyticsPermissionKey,
) {
  if (!permissions?.length) return false;
  return permissions.includes(permission);
}
