import type { AnalyticsPermissionKey } from './types';

export const ANALYTICS_PERMISSION_KEYS = {
  basic: 'view_basic_analytics',
  operational: 'view_operational_analytics',
  financial: 'view_financial_analytics',
  branch: 'view_branch_analytics',
  global: 'view_global_analytics',
  personal: 'view_personal_analytics',
} as const satisfies Record<string, AnalyticsPermissionKey>;

export function hasAnalyticsPermission(
  permissions: readonly string[] | undefined,
  permission: AnalyticsPermissionKey,
) {
  if (!permissions?.length) return false;
  return permissions.includes(permission);
}
