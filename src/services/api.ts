import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';
import { useAuthStore } from '@/stores/auth-store';
import { TheAduseiErrorResponse } from '@/lib/TheAduseiErrorResponse';

type QueryMeta = Record<string, never>;
type QueryResult = QueryReturnValue<unknown, FetchBaseQueryError, QueryMeta>;

const inFlightRequests = new Map<string, Promise<QueryResult>>();

function safeSerialize(value: unknown): string {
  if (value === undefined) return '';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (value instanceof URLSearchParams) return value.toString();
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return JSON.stringify(Array.from(value.entries()));
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function buildRequestKey(args: string | FetchArgs): string {
  if (typeof args === 'string') {
    return `GET|${args}|`;
  }

  const method = (args.method ?? 'GET').toUpperCase();
  const url = args.url;
  const params = safeSerialize(args.params);
  const body = safeSerialize(args.body);
  return `${method}|${url}|${params}|${body}`;
}

function shouldDedupeRequest(args: string | FetchArgs): boolean {
  if (typeof args === 'string') return true;
  const method = (args.method ?? 'GET').toUpperCase();
  return method === 'GET';
}

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
  const runRequest = async (): Promise<QueryResult> => {
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
          const data = refreshResult.data as
            | { tokens: { accessToken: string; refreshToken: string } }
            | { accessToken: string; refreshToken: string };
          const nextAccessToken = 'tokens' in data ? data.tokens.accessToken : data.accessToken;
          const nextRefreshToken = 'tokens' in data ? data.tokens.refreshToken : data.refreshToken;
          const currentUser = useAuthStore.getState().user;

          if (currentUser) {
            useAuthStore.getState().setAuth({
              user: currentUser,
              accessToken: nextAccessToken,
              refreshToken: nextRefreshToken,
            });

            // Retry the original request with new token
            result = await baseQuery(args, api, extraOptions);
          }
        } else {
          // Refresh failed - logout user
          useAuthStore.getState().logout();
          TheAduseiErrorResponse(refreshResult.error ?? 'Session expired');
        }
      } else {
        // No refresh token available - logout user
        useAuthStore.getState().logout();
        TheAduseiErrorResponse('Your session has expired. Please log in again.');
      }
    }

    if (result.error && result.error.status !== 401) {
      TheAduseiErrorResponse(result.error);
    }

    return result as QueryReturnValue<unknown, FetchBaseQueryError, QueryMeta>;
  };

  if (!shouldDedupeRequest(args)) {
    return runRequest();
  }

  const requestKey = buildRequestKey(args);
  const pending = inFlightRequests.get(requestKey);
  if (pending) {
    return pending;
  }

  const requestPromise = runRequest().finally(() => {
    inFlightRequests.delete(requestKey);
  });

  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 120,
  tagTypes: [
    'Auth',
    'Bookings',
    'Cards',
    'CompanyModules',
    'Customers',
    'Inventory',
    'Branches',
    'HR',
    'Locations',
    'Payroll',
    'Statuses',
    'Users',
    'Cashiers',
    'RBAC',
    'Accounting',
  ],
  endpoints: () => ({}),
});

export type Api = typeof api;
