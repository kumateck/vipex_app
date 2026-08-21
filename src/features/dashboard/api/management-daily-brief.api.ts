import { api } from '@/services/api';

export type ManagementDailyBriefResult = {
  id: string;
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  narrative: string | null;
  provider: string | null;
  succeeded: boolean;
  generatedByUserId: string;
  createdAt: string;
};

export const managementDailyBriefApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLatestManagementDailyBrief: builder.query<ManagementDailyBriefResult | null, void>({
      query: () => ({ url: '/management-daily-brief/latest' }),
      providesTags: [{ type: 'ManagementDailyBrief', id: 'LATEST' }],
    }),
    generateManagementDailyBrief: builder.mutation<ManagementDailyBriefResult, void>({
      query: () => ({
        url: '/management-daily-brief/generate',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'ManagementDailyBrief', id: 'LATEST' }],
    }),
  }),
});

export const { useGetLatestManagementDailyBriefQuery, useGenerateManagementDailyBriefMutation } =
  managementDailyBriefApi;
