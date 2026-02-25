import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import type { User, UserCreatePayload, UserListQuery, UserMutationInput } from '../types/user.types';
import { toCreateUserPayload, toUpdateUserPayload } from '../utils/user-payload';

export interface UserOption {
  id: string;
  fullname: string;
  email: string;
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<ServerListResponse<User>, UserListQuery | void>({
      query: (query) => ({
        url: '/users/',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Users', result),
    }),

    getUser: builder.query<User, string>({
      query: (id) => ({ url: `/users/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Users', id }],
    }),

    listUserOptions: builder.query<
      UserOption[],
      { companyId?: string | null; branchId?: string | null; roleId?: string | null; status?: number; search?: string } | void
    >({
      query: (params) => ({
        url: '/users/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Users', id: 'OPTIONS' }],
    }),

    createUser: builder.mutation<{ id: string }, UserMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');

        return {
          url: '/users/',
          method: 'POST',
          body: toCreateUserPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }) satisfies UserCreatePayload,
        };
      },
      invalidatesTags: invalidateEntityListTag('Users'),
    }),

    updateUser: builder.mutation<{ id: string }, { id: string; body: UserMutationInput }>({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: toUpdateUserPayload(body),
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Users', id }, ...invalidateEntityListTag('Users')],
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserQuery,
  useListUserOptionsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = usersApi;
