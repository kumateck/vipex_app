import { PermissionKeys } from '@/shared/permissions/constants';
import type { AnalyticsPermissionKey } from './types';

export const ANALYTICS_PERMISSION_KEYS = {
  basic: PermissionKeys.CanViewBasicAnalytics,
  operational: PermissionKeys.CanViewOperationalAnalytics,
  financial: PermissionKeys.CanViewFinancialAnalytics,
  branch: PermissionKeys.CanViewBranchAnalytics,
  global: PermissionKeys.CanViewGlobalAnalytics,
  personal: PermissionKeys.CanViewPersonalAnalytics,
} as const satisfies Record<string, AnalyticsPermissionKey>;

const LEGACY_ANALYTICS_PERMISSION_ALIASES: Record<AnalyticsPermissionKey, string> = {
  [PermissionKeys.CanViewBasicAnalytics]: 'view_basic_analytics',
  [PermissionKeys.CanViewOperationalAnalytics]: 'view_operational_analytics',
  [PermissionKeys.CanViewFinancialAnalytics]: 'view_financial_analytics',
  [PermissionKeys.CanViewBranchAnalytics]: 'view_branch_analytics',
  [PermissionKeys.CanViewGlobalAnalytics]: 'view_global_analytics',
  [PermissionKeys.CanViewPersonalAnalytics]: 'view_personal_analytics',
};

export function hasAnalyticsPermission(
  permissions: readonly string[] | undefined,
  permission: AnalyticsPermissionKey,
) {
  if (!permissions?.length) return false;
  if (permissions.includes(permission)) return true;
  return permissions.includes(LEGACY_ANALYTICS_PERMISSION_ALIASES[permission]);
}
