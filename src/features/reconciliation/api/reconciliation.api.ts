import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export type ReconciliationBranchOption = {
  id: string;
  name: string;
};

export type ReconciliationSession = {
  id: string;
  branchId: string;
  branchName: string | null;
  cashierUserId: string | null;
  cashierName: string | null;
  confirmationDate: string;
  expectedCashPsw: number;
  countedCashPsw: number;
  shortagePsw: number;
  overagePsw: number;
  notes: string | null;
  status: number;
  confirmedAt: string | null;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BankSettlement = {
  id: string;
  settlementNo: string;
  settlementDate: string;
  branchId: string;
  branchName: string | null;
  bankReference: string | null;
  expectedAmountPsw: number;
  bankedAmountPsw: number;
  variancePsw: number;
  notes: string | null;
  status: number;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const reconciliationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listReconciliationBranchOptions: builder.query<ReconciliationBranchOption[], void>({
      query: () => ({ url: '/reconciliation/branch-options' }),
      providesTags: [{ type: 'Reconciliation', id: 'BRANCH_OPTIONS' }],
    }),

    listReconciliationSessions: builder.query<
      ServerListResponse<ReconciliationSession>,
      ServerListQuery<{ status?: number; branchId?: string; pendingOnly?: boolean }> | void
    >({
      query: (query) => ({
        url: '/reconciliation/sessions',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Reconciliation', result),
    }),

    createReconciliationSession: builder.mutation<
      { id: string },
      {
        branchId: string;
        confirmationDate: string;
        expectedCashCedis: number | string;
        countedCashCedis: number | string;
        notes?: string | null;
        cashierUserId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/reconciliation/sessions',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Reconciliation'),
    }),

    approveReconciliationSession: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/reconciliation/sessions/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Reconciliation', id },
        ...invalidateEntityListTag('Reconciliation'),
      ],
    }),

    finalizeReconciliationSession: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/reconciliation/sessions/${id}/finalize`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Reconciliation', id },
        ...invalidateEntityListTag('Reconciliation'),
      ],
    }),

    listBankSettlements: builder.query<
      ServerListResponse<BankSettlement>,
      ServerListQuery<{ status?: number; branchId?: string; pendingOnly?: boolean }> | void
    >({
      query: (query) => ({
        url: '/reconciliation/bank-settlements',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Reconciliation', result),
    }),

    createBankSettlement: builder.mutation<
      { id: string },
      {
        branchId: string;
        settlementDate: string;
        settlementNo?: string | null;
        bankReference?: string | null;
        expectedAmountPsw: number;
        bankedAmountPsw: number;
        notes?: string | null;
      }
    >({
      query: (body) => ({
        url: '/reconciliation/bank-settlements',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Reconciliation'),
    }),

    approveBankSettlement: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/reconciliation/bank-settlements/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Reconciliation', id },
        ...invalidateEntityListTag('Reconciliation'),
      ],
    }),

    rejectBankSettlement: builder.mutation<
      { id: string },
      {
        id: string;
        rejectionReason: string;
      }
    >({
      query: ({ id, rejectionReason }) => ({
        url: `/reconciliation/bank-settlements/${id}/reject`,
        method: 'POST',
        body: { rejectionReason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Reconciliation', id },
        ...invalidateEntityListTag('Reconciliation'),
      ],
    }),
  }),
});

export const {
  useListReconciliationBranchOptionsQuery,
  useListReconciliationSessionsQuery,
  useCreateReconciliationSessionMutation,
  useApproveReconciliationSessionMutation,
  useFinalizeReconciliationSessionMutation,
  useListBankSettlementsQuery,
  useCreateBankSettlementMutation,
  useApproveBankSettlementMutation,
  useRejectBankSettlementMutation,
} = reconciliationApi;
