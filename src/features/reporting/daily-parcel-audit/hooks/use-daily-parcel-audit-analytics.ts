import { useMemo } from 'react';
import type { DailyParcelAuditRow } from '../types/daily-parcel-audit.types';
import { buildDailyParcelAuditAnalytics } from '../utils/daily-parcel-audit-analytics';

export function useDailyParcelAuditAnalytics(rows: DailyParcelAuditRow[]) {
  return useMemo(() => buildDailyParcelAuditAnalytics(rows), [rows]);
}
