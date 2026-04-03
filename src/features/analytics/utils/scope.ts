import { BranchType } from '@/db/schemas/enums';
import type { AuthUser } from '@/stores/auth-store';
import { ANALYTICS_ALL, type AnalyticsResolvedScope, type AnalyticsScopeMeta } from '../types';

function resolveScopeMeta(user: AuthUser | null): AnalyticsScopeMeta {
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const fixedBranchId = user?.branch?.id ?? null;
  const fixedLocationId = user?.locationId ?? user?.location?.id ?? null;

  if (fixedLocationId) {
    return {
      mode: 'LOCATION',
      fixedBranchId,
      fixedLocationId,
    };
  }

  if (isHeadOffice) {
    return {
      mode: 'HEAD_OFFICE',
      fixedBranchId: null,
      fixedLocationId: null,
    };
  }

  return {
    mode: 'BRANCH',
    fixedBranchId,
    fixedLocationId: null,
  };
}

export function resolveAnalyticsScope(args: {
  user: AuthUser | null;
  selectedBranchId?: string | typeof ANALYTICS_ALL;
  selectedLocationId?: string | typeof ANALYTICS_ALL;
  dateRange?: string;
}): AnalyticsResolvedScope {
  const meta = resolveScopeMeta(args.user);

  if (meta.mode === 'LOCATION') {
    return {
      branchId: meta.fixedBranchId ?? undefined,
      locationId: meta.fixedLocationId ?? undefined,
      dateRange: args.dateRange,
      meta,
    };
  }

  if (meta.mode === 'BRANCH') {
    return {
      branchId: meta.fixedBranchId ?? undefined,
      locationId: args.selectedLocationId ?? ANALYTICS_ALL,
      dateRange: args.dateRange,
      meta,
    };
  }

  return {
    branchId: args.selectedBranchId ?? ANALYTICS_ALL,
    locationId: args.selectedLocationId ?? ANALYTICS_ALL,
    dateRange: args.dateRange,
    meta,
  };
}
