import { api } from '@/services/api';
import type { DailyParcelAuditReport } from '../types/daily-parcel-audit.types';

const dailyParcelAuditApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDailyParcelAuditReport: builder.query<
      DailyParcelAuditReport,
      { date: string; branchId?: string | null }
    >({
      query: (params) => ({ url: '/reports/daily-parcel-audit', params }),
    }),
  }),
});

export const { useLazyGetDailyParcelAuditReportQuery } = dailyParcelAuditApi;
