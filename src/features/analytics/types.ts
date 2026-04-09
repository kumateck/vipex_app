import type { DateRange } from 'react-day-picker';
import { PermissionKeys } from '@/shared/permissions/constants';

export const ANALYTICS_ALL = 'ALL';

export type AnalyticsContract = {
  branchId?: string | typeof ANALYTICS_ALL;
  locationId?: string | typeof ANALYTICS_ALL;
  dateRange?: string;
};

export type AnalyticsPermissionKey =
  | typeof PermissionKeys.view_basic_analytics
  | typeof PermissionKeys.view_operational_analytics
  | typeof PermissionKeys.view_financial_analytics
  | typeof PermissionKeys.view_branch_analytics
  | typeof PermissionKeys.view_global_analytics
  | typeof PermissionKeys.view_personal_analytics;

export type AnalyticsFiltersState = {
  branchId: string | typeof ANALYTICS_ALL;
  locationId: string | typeof ANALYTICS_ALL;
  dateRange: string;
  customDateRange?: DateRange;
};

export type AnalyticsScopeMode = 'HEAD_OFFICE' | 'BRANCH' | 'LOCATION';

export type AnalyticsScopeMeta = {
  mode: AnalyticsScopeMode;
  fixedBranchId: string | null;
  fixedLocationId: string | null;
};

export type AnalyticsResolvedScope = AnalyticsContract & {
  meta: AnalyticsScopeMeta;
};
