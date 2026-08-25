import { api } from '@/services/api';
import type { SetUserPasswordInput, UserPasswordTarget } from '../types';

export const userPasswordManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUserPasswordTargets: builder.query<UserPasswordTarget[], void>({
      query: () => ({ url: '/users/password-management/options' }),
    }),
    setUserPassword: builder.mutation<{ success: true }, SetUserPasswordInput>({
      query: ({ userId, password }) => ({
        url: `/users/${userId}/password`,
        method: 'PUT',
        body: { password },
      }),
    }),
  }),
});

export const { useListUserPasswordTargetsQuery, useSetUserPasswordMutation } =
  userPasswordManagementApi;
