import type { DateRange } from 'react-day-picker';
import { PermissionKeys } from '@/shared/permissions/constants';

export const ANALYTICS_ALL = 'ALL';

export type AnalyticsContract = {
  branchId?: string | typeof ANALYTICS_ALL;
  locationId?: string | typeof ANALYTICS_ALL;
  dateRange?: string;
};

export type AnalyticsPermissionKey =
  | typeof PermissionKeys.CanViewBasicAnalytics
  | typeof PermissionKeys.CanViewOperationalAnalytics
  | typeof PermissionKeys.CanViewFinancialAnalytics
  | typeof PermissionKeys.CanViewBranchAnalytics
  | typeof PermissionKeys.CanViewGlobalAnalytics
  | typeof PermissionKeys.CanViewPersonalAnalytics;

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
