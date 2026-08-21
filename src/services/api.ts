import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';
import { useAuthStore } from '@/stores/auth-store';
import { TheAduseiErrorResponse } from '@/lib/TheAduseiErrorResponse';

type QueryMeta = FetchBaseQueryMeta;
type QueryResult = QueryReturnValue<unknown, FetchBaseQueryError, QueryMeta>;

const inFlightRequests = new Map<string, Promise<QueryResult>>();
let inFlightTokenRefresh: Promise<QueryResult> | null = null;

export function clearApiInFlightRequests() {
  inFlightRequests.clear();
}

function sanitizeQueryParams(params: FetchArgs['params']): FetchArgs['params'] {
  if (!params || typeof params !== 'object' || params instanceof URLSearchParams) {
    return params;
  }

  const entries = Object.entries(params as Record<string, unknown>).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim().toLowerCase() === 'null') return false;
    return true;
  });

  return Object.fromEntries(entries) as Record<string, unknown>;
}

function sanitizeFetchArgs(args: string | FetchArgs): string | FetchArgs {
  if (typeof args === 'string') return args;
  if (!('params' in args) || args.params === undefined) return args;

  return {
    ...args,
    params: sanitizeQueryParams(args.params),
  };
}

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
  const authState = useAuthStore.getState();
  const userId = authState.user?.id ?? 'anonymous';
  if (typeof args === 'string') {
    return `GET|${args}||${userId}`;
  }

  const method = (args.method ?? 'GET').toUpperCase();
  const url = args.url;
  const params = safeSerialize(args.params);
  const body = safeSerialize(args.body);
  return `${method}|${url}|${params}|${body}|${userId}`;
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
  apiContext,
  extraOptions,
) => {
  const runTokenRefresh = async (refreshToken: string): Promise<QueryResult> => {
    if (inFlightTokenRefresh) return inFlightTokenRefresh;

    const refreshRequest = Promise.resolve(
      baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        apiContext,
        extraOptions,
      ),
    );

    inFlightTokenRefresh = refreshRequest.finally(() => {
      inFlightTokenRefresh = null;
    });

    return refreshRequest;
  };

  const requestArgs = sanitizeFetchArgs(args);

  const runRequest = async (): Promise<QueryResult> => {
    let result = await baseQuery(requestArgs, apiContext, extraOptions);

    // If we get a 401, try to refresh the token
    if (result.error && result.error.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        // Collapse concurrent 401 recoveries into one refresh call.
        const refreshResult = await runTokenRefresh(refreshToken);

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
            result = await baseQuery(requestArgs, apiContext, extraOptions);
          }
        } else {
          // Refresh failed - logout user
          clearApiInFlightRequests();
          apiContext.dispatch(api.util.resetApiState());
          useAuthStore.getState().logout();
          TheAduseiErrorResponse(refreshResult.error ?? 'Session expired');
        }
      } else {
        // No refresh token available - logout user
        clearApiInFlightRequests();
        apiContext.dispatch(api.util.resetApiState());
        useAuthStore.getState().logout();
        TheAduseiErrorResponse('Your session has expired. Please log in again.');
      }
    }

    // Non-401 API errors are handled by feature-level mutation/query consumers.
    // Avoid global duplicate toasts (feature toast + global toast).

    return result as QueryReturnValue<unknown, FetchBaseQueryError, QueryMeta>;
  };

  if (!shouldDedupeRequest(args)) {
    return runRequest();
  }

  const requestKey = buildRequestKey(requestArgs);
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
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: true,
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
    'Warehouses',
    'Payroll',
    'Statuses',
    'Users',
    'Cashiers',
    'RBAC',
    'Accounting',
    'Procurement',
    'FleetTransport',
    'CustomerWalletCredit',
    'Reconciliation',
    'NotificationHub',
    'ItSupport',
    'Communication',
    'ExecutiveInsights',
    'AiChatConversation',
    'FleetAnomalyBrief',
    'OperationsExceptionsBrief',
    'ManagementDailyBrief',
  ],
  endpoints: () => ({}),
});

export type Api = typeof api;
