import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useAuthStore } from '@/store/auth-store';

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
  const result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    // Optionally refresh token here by calling /auth/refresh
    // If refresh succeeds, retry original request.
    // For now, just logout.
    useAuthStore.getState().logout();
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
