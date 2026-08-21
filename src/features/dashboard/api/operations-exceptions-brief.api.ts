import { api } from '@/services/api';

export type OperationsExceptionsBriefResult = {
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

export const operationsExceptionsBriefApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLatestOperationsExceptionsBrief: builder.query<
      OperationsExceptionsBriefResult | null,
      { branchId?: string | null }
    >({
      query: ({ branchId }) => ({
        url: '/operations-exceptions-brief/latest',
        params: branchId ? { branchId } : undefined,
      }),
      providesTags: [{ type: 'OperationsExceptionsBrief', id: 'LATEST' }],
    }),
    generateOperationsExceptionsBrief: builder.mutation<
      OperationsExceptionsBriefResult,
      { from: string; to: string; branchId?: string | null }
    >({
      query: (body) => ({
        url: '/operations-exceptions-brief/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'OperationsExceptionsBrief', id: 'LATEST' }],
    }),
  }),
});

export const {
  useGetLatestOperationsExceptionsBriefQuery,
  useGenerateOperationsExceptionsBriefMutation,
} = operationsExceptionsBriefApi;
