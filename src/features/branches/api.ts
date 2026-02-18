import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';

export interface Branch {
  id: string;
  name: string;
  type: string;
  telephone: string | null;
  address: string | null;
  email: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListBranchesResponse {
  data: Branch[];
  nextCursor?: string | null;
}

export interface ListBranchesParams {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
}

export interface UpdateBranchBody {
  name?: string;
  type?: string;
  telephone?: string | null;
  address?: string | null;
  email?: string | null;
}

export interface CreateBranchBody {
  name: string;
  type: string;
  telephone?: string | null;
  address?: string | null;
  email?: string | null;
}

export const branchesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listBranches: builder.query<ListBranchesResponse, ListBranchesParams | void>({
      query: (params) => ({
        url: '/branches/',
        params: params ?? { limit: 50 },
      }),
      providesTags: (result) =>
        result
          ? [{ type: 'Branches', id: 'LIST' }, ...result.data.map((b) => ({ type: 'Branches' as const, id: b.id }))]
          : [{ type: 'Branches', id: 'LIST' }],
    }),

    getBranch: builder.query<Branch, string>({
      query: (id) => ({ url: `/branches/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Branches', id }],
    }),

    updateBranch: builder.mutation<{ id: string }, { id: string; body: UpdateBranchBody }>({
      query: ({ id, body }) => ({
        url: `/branches/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Branches', id }, { type: 'Branches', id: 'LIST' }],
    }),

    createBranch: builder.mutation<{ id: string }, CreateBranchBody>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/branches/',
          method: 'POST',
          body: {
            companyId: user.company.id,
            createdBy: user.id,
            name: body.name,
            type: body.type,
            telephone: body.telephone ?? null,
            address: body.address ?? null,
            email: body.email ?? null,
          },
        };
      },
      invalidatesTags: [{ type: 'Branches', id: 'LIST' }],
    }),

    deleteBranch: builder.mutation<void, string>({
      query: (id) => ({
        url: `/branches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Branches', id }, { type: 'Branches', id: 'LIST' }],
    }),
  }),
});

export const {
  useListBranchesQuery,
  useGetBranchQuery,
  useUpdateBranchMutation,
  useCreateBranchMutation,
  useDeleteBranchMutation,
} = branchesApi;
