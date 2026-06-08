import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import type { BranchType } from '@/shared/access/constants';
import type {
  Branch,
  BranchCreatePayload,
  BranchListQuery,
  BranchMutationInput,
  BranchUpdatePayload,
} from '../types/branch.types';
import { toCreateBranchPayload, toUpdateBranchPayload } from '../utils/branch-payload';

export interface BranchOption {
  id: string;
  name: string;
  type: BranchType;
}

export type BranchOperationsSettings = {
  id: string;
  usePickupQueue: boolean;
};

export const branchesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listBranches: builder.query<ServerListResponse<Branch>, BranchListQuery | void>({
      query: (query) => ({
        url: '/branches/',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Branches', result),
    }),

    getBranch: builder.query<Branch, string>({
      query: (id) => ({ url: `/branches/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Branches', id }],
    }),

    getBranchOperationsSettings: builder.query<BranchOperationsSettings, string>({
      query: (id) => ({ url: `/branches/${id}/operations-settings` }),
      providesTags: (_result, _err, id) => [{ type: 'Branches', id }],
    }),

    listBranchOptions: builder.query<
      BranchOption[],
      { companyId?: string | null; search?: string; includeDeleted?: boolean } | void
    >({
      query: (params) => ({
        url: '/branches/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Branches', id: 'OPTIONS' }],
    }),

    updateBranch: builder.mutation<{ id: string }, { id: string; body: BranchMutationInput }>({
      query: ({ id, body }) => ({
        url: `/branches/${id}`,
        method: 'PATCH',
        body: toUpdateBranchPayload(body) satisfies BranchUpdatePayload,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Branches', id },
        ...invalidateEntityListTag('Branches'),
      ],
    }),

    createBranch: builder.mutation<{ id: string }, BranchMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');

        return {
          url: '/branches/',
          method: 'POST',
          body: toCreateBranchPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }) satisfies BranchCreatePayload,
        };
      },
      invalidatesTags: invalidateEntityListTag('Branches'),
    }),

    deleteBranch: builder.mutation<void, string>({
      query: (id) => ({
        url: `/branches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Branches', id },
        ...invalidateEntityListTag('Branches'),
      ],
    }),
  }),
});

export const {
  useListBranchesQuery,
  useGetBranchQuery,
  useGetBranchOperationsSettingsQuery,
  useListBranchOptionsQuery,
  useUpdateBranchMutation,
  useCreateBranchMutation,
  useDeleteBranchMutation,
} = branchesApi;
