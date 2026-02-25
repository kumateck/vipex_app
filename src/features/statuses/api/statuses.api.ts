import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import type {
  Status,
  StatusCreatePayload,
  StatusListQuery,
  StatusMutationInput,
  StatusUpdatePayload,
} from '../types/status.types';
import { toCreateStatusPayload, toUpdateStatusPayload } from '../utils/status-payload';

export const statusesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listStatuses: builder.query<ServerListResponse<Status>, StatusListQuery | void>({
      query: (query) => ({
        url: '/statuses/',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Statuses', result),
    }),

    getStatus: builder.query<Status, string>({
      query: (id) => ({ url: `/statuses/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Statuses', id }],
    }),

    updateStatus: builder.mutation<{ id: string }, { id: string; body: StatusMutationInput }>({
      query: ({ id, body }) => ({
        url: `/statuses/${id}`,
        method: 'PATCH',
        body: toUpdateStatusPayload(body) satisfies StatusUpdatePayload,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Statuses', id },
        ...invalidateEntityListTag('Statuses'),
      ],
    }),

    createStatus: builder.mutation<{ id: string }, StatusMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');

        return {
          url: '/statuses/',
          method: 'POST',
          body: toCreateStatusPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }) satisfies StatusCreatePayload,
        };
      },
      invalidatesTags: invalidateEntityListTag('Statuses'),
    }),

    deleteStatus: builder.mutation<void, string>({
      query: (id) => ({
        url: `/statuses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Statuses', id },
        ...invalidateEntityListTag('Statuses'),
      ],
    }),
  }),
});

export const {
  useListStatusesQuery,
  useGetStatusQuery,
  useUpdateStatusMutation,
  useCreateStatusMutation,
  useDeleteStatusMutation,
} = statusesApi;
