import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import type {
  User,
  UserCreatePayload,
  UserListQuery,
  UserMutationInput,
} from '../types/user.types';
import { toCreateUserPayload, toUpdateUserPayload } from '../utils/user-payload';
import type { CashierType, UserType } from '@/shared/access/constants';

export interface UserOption {
  id: string;
  fullname: string;
  email: string;
  branchId?: string | null;
  locationId?: string | null;
  branchType?: number | null;
  roleName?: string | null;
  branchName?: string | null;
  locationName?: string | null;
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
      {
        companyId?: string | null;
        branchId?: string | null;
        locationId?: string | null;
        roleId?: string | null;
        userType?: UserType | null;
        cashierType?: CashierType | null;
        status?: number;
        search?: string;
      } | void
    >({
      query: (params) => ({
        url: '/users/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Users', id: 'OPTIONS' }],
    }),

    createUser: builder.mutation<{ id: string }, UserMutationInput>({
      query: (body) => ({
        url: '/users/',
        method: 'POST',
        body: toCreateUserPayload(body) satisfies UserCreatePayload,
      }),
      invalidatesTags: invalidateEntityListTag('Users'),
    }),

    updateUser: builder.mutation<{ id: string }, { id: string; body: UserMutationInput }>({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: toUpdateUserPayload(body),
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Users', id },
        ...invalidateEntityListTag('Users'),
        'Auth',
      ],
    }),
    updateUserStatus: builder.mutation<{ id: string }, { id: string; status: number }>({
      query: ({ id, status }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Users', id },
        ...invalidateEntityListTag('Users'),
        'Auth',
      ],
    }),

    resendSetupInvite: builder.mutation<
      { ok: boolean; expiresAt: string },
      { id: string; force?: boolean }
    >({
      query: ({ id, force = true }) => ({
        url: `/users/auth/resend-setup/${id}`,
        method: 'POST',
        body: { force },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Users', id },
        ...invalidateEntityListTag('Users'),
      ],
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserQuery,
  useListUserOptionsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useResendSetupInviteMutation,
} = usersApi;
