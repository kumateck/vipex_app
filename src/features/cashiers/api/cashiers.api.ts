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
  CloseCashierSessionInput,
  OpenCashierSessionInput,
} from '../types/cashier.types';

export const cashiersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listSessionTypes: builder.query<CashierSessionType[], void>({
      query: () => ({ url: '/cashiers/session-types' }),
      providesTags: [{ type: 'Cashiers', id: 'SESSION_TYPES' }],
    }),

    listSessions: builder.query<ServerListResponse<CashierSession>, CashierSessionListQuery | void>({
      query: (query) => ({
        url: '/cashiers/sessions',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Cashiers', result),
    }),
    getCurrentActiveSession: builder.query<CashierSession | null, void>({
      query: () => ({ url: '/cashiers/sessions/active/current' }),
      providesTags: [{ type: 'Cashiers', id: 'ACTIVE_SESSION' }],
    }),

    openSession: builder.mutation<{ id: string }, OpenCashierSessionInput>({
      query: (body) => ({
        url: '/cashiers/sessions',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('Cashiers'),
    }),

    closeSession: builder.mutation<{ id: string }, { id: string; body: CloseCashierSessionInput }>({
      query: ({ id, body }) => ({
        url: `/cashiers/sessions/${id}/close`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Cashiers', id }, ...invalidateEntityListTag('Cashiers')],
    }),
  }),
});

export const { useListSessionTypesQuery, useListSessionsQuery, useOpenSessionMutation, useCloseSessionMutation } =
  cashiersApi;
export const { useGetCurrentActiveSessionQuery } = cashiersApi;
