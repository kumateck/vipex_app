import type { AnalyticsScope } from './types';
import { buildParcelAnalyticsReport } from './aggregation';
import {
  countPreviousParcelAnalytics,
  getParcelAnalyticsGroups,
  listParcelAnalyticsBranches,
} from './repository';

export async function getParcelAnalyticsReport(scope: AnalyticsScope) {
  const now = new Date();
  const [groups, branches, previous] = await Promise.all([
    getParcelAnalyticsGroups(scope, now),
    listParcelAnalyticsBranches(scope),
    countPreviousParcelAnalytics(scope),
  ]);
  return buildParcelAnalyticsReport(groups, scope, branches, previous, now);
}
