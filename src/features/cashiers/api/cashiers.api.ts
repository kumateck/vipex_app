import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import type {
  CashierSession,
  CashierSessionListQuery,
  CashierSessionType,
  CashierSessionSummary,
  CloseCashierSessionInput,
  OpenCashierSessionInput,
} from '../types/cashier.types';

export type CashierSessionDelegate = {
  userId: string;
  fullname: string;
  email: string;
  assignedAt: string;
};
export type CashierSessionDelegateOption = { id: string; fullname: string; email: string };
export type CashierSessionDelegateList = {
  eligible: CashierSessionDelegateOption[];
  assigned: CashierSessionDelegate[];
};

export const cashiersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listSessionTypes: builder.query<CashierSessionType[], void>({
      query: () => ({ url: '/cashiers/session-types' }),
      providesTags: [{ type: 'Cashiers', id: 'SESSION_TYPES' }],
    }),

    listSessions: builder.query<ServerListResponse<CashierSession>, CashierSessionListQuery | void>(
      {
        query: (query) => ({
          url: '/cashiers/sessions',
          params: buildServerPaginationParams(query),
        }),
        providesTags: (result) => provideEntityListTags('Cashiers', result),
      },
    ),
    getCurrentActiveSession: builder.query<CashierSession | null, void>({
      query: () => ({ url: '/cashiers/sessions/active/current' }),
      providesTags: [{ type: 'Cashiers', id: 'ACTIVE_SESSION' }],
    }),
    getCurrentActiveSessionSummary: builder.query<
      CashierSessionSummary | null,
      { mode: 'sender' | 'receiver' | 'delivery' | 'full' }
    >({
      query: (params) => ({ url: '/cashiers/sessions/active/current/summary', params }),
      providesTags: [{ type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' }],
    }),

    openSession: builder.mutation<{ id: string }, OpenCashierSessionInput>({
      query: (body) => ({
        url: '/cashiers/sessions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        ...invalidateEntityListTag('Cashiers'),
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
      ],
    }),

    closeSession: builder.mutation<{ id: string }, { id: string; body: CloseCashierSessionInput }>({
      query: ({ id, body }) => ({
        url: `/cashiers/sessions/${id}/close`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Cashiers', id },
        { type: 'Cashiers', id: 'ACTIVE_SESSION' },
        { type: 'Cashiers', id: 'ACTIVE_SESSION_SUMMARY' },
        ...invalidateEntityListTag('Cashiers'),
      ],
    }),
    getSessionDelegates: builder.query<CashierSessionDelegateList, string>({
      query: (id) => ({ url: `/cashiers/sessions/${id}/delegates` }),
      providesTags: [{ type: 'Cashiers', id: 'SESSION_DELEGATES' }],
    }),
    assignSessionDelegate: builder.mutation<
      { sessionId: string; userId: string },
      { sessionId: string; userId: string }
    >({
      query: ({ sessionId, userId }) => ({
        url: `/cashiers/sessions/${sessionId}/delegates`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: [{ type: 'Cashiers', id: 'SESSION_DELEGATES' }],
    }),
    revokeSessionDelegate: builder.mutation<
      { sessionId: string; userId: string },
      { sessionId: string; userId: string }
    >({
      query: ({ sessionId, userId }) => ({
        url: `/cashiers/sessions/${sessionId}/delegates/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Cashiers', id: 'SESSION_DELEGATES' }],
    }),
  }),
});

export const {
  useListSessionTypesQuery,
  useListSessionsQuery,
  useOpenSessionMutation,
  useCloseSessionMutation,
  useGetCurrentActiveSessionQuery,
  useGetCurrentActiveSessionSummaryQuery,
  useGetSessionDelegatesQuery,
  useAssignSessionDelegateMutation,
  useRevokeSessionDelegateMutation,
} = cashiersApi;
