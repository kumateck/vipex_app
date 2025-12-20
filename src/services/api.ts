import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useAuthStore } from '@/stores/auth-store';

const baseQuery = fetchBaseQuery({
  baseUrl: '/v1',
  prepareHeaders: (headers) => {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    headers.set('content-type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401, try to refresh the token
  if (result.error && result.error.status === 401) {
    const refreshToken = useAuthStore.getState().refreshToken;

    if (refreshToken) {
      // Try to refresh the token
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        // Successfully refreshed - update auth state
        const data = refreshResult.data as { accessToken: string; refreshToken: string };
        const currentUser = useAuthStore.getState().user;

        if (currentUser) {
          useAuthStore.getState().setAuth({
            user: currentUser,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });

          // Retry the original request with new token
          result = await baseQuery(args, api, extraOptions);
        }
      } else {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
      }
    } else {
      // No refresh token available - logout user
      useAuthStore.getState().logout();
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Bookings', 'Customers', 'Inventory'],
  endpoints: () => ({}),
});

export type Api = typeof api;
