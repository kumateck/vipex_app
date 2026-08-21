import { api } from '@/services/api';

export type ExecutiveInsightsBranchFigure = {
  branchName: string;
  incomeCedis: number;
  expenseCedis: number;
  netProfitCedis: number;
};

export type ExecutiveInsightsDataCompleteness = {
  income: boolean;
  cashFlow: boolean;
  branchProfitability: boolean;
  creditExposure: boolean;
  auditAnalytics: boolean;
};

export type ExecutiveInsightsGrounding = {
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  totalIncomeCedis: number;
  totalExpenseCedis: number;
  netProfitCedis: number;
  netCashChangeCedis: number;
  operatingCashNetCedis: number;
  branches: ExecutiveInsightsBranchFigure[];
  creditOutstandingCedis: number;
  creditBucket1To30Cedis: number;
  creditBucket31To60Cedis: number;
  creditBucket61To90Cedis: number;
  creditBucket91PlusCedis: number;
  auditTotalEvents: number;
  auditSuspiciousActions: number;
  auditDeletedActions: number;
  auditSecuritySignals: number;
  dataCompleteness: ExecutiveInsightsDataCompleteness;
};

export type ExecutiveInsightsResult = {
  id: string;
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  narrative: string | null;
  provider: string | null;
  succeeded: boolean;
  grounding: ExecutiveInsightsGrounding | null;
  generatedByUserId: string;
  createdAt: string;
};

export const executiveInsightsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLatestExecutiveInsights: builder.query<
      ExecutiveInsightsResult | null,
      { branchId?: string | null }
    >({
      query: ({ branchId }) => ({
        url: '/executive-insights/latest',
        params: branchId ? { branchId } : undefined,
      }),
      providesTags: [{ type: 'ExecutiveInsights', id: 'LATEST' }],
    }),
    generateExecutiveInsights: builder.mutation<
      ExecutiveInsightsResult,
      { from: string; to: string; branchId?: string | null }
    >({
      query: (body) => ({
        url: '/executive-insights/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ExecutiveInsights', id: 'LATEST' }],
    }),
  }),
});

export const { useGetLatestExecutiveInsightsQuery, useGenerateExecutiveInsightsMutation } =
  executiveInsightsApi;
