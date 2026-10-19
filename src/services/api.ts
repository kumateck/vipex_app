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
import { refreshAuthSession } from '@/features/auth/session';

type QueryMeta = FetchBaseQueryMeta;
type QueryResult = QueryReturnValue<unknown, FetchBaseQueryError, QueryMeta>;

const inFlightRequests = new Map<string, Promise<QueryResult>>();

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
  const headers = safeSerialize(args.headers);
  return `${method}|${url}|${params}|${body}|${headers}|${userId}`;
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
  const requestArgs = sanitizeFetchArgs(args);

  const runRequest = async (): Promise<QueryResult> => {
    const sentSession = useAuthStore.getState();
    const sentAccessToken = sentSession.accessToken;
    const sentUserId = sentSession.user?.id;
    let result = await baseQuery(requestArgs, apiContext, extraOptions);

    // If we get a 401, try to refresh the token
    if (result.error && result.error.status === 401) {
      if (sentUserId && useAuthStore.getState().user?.id !== sentUserId) {
        return {
          error: { status: 'CUSTOM_ERROR', error: 'Session changed. Please retry.' },
        };
      }
      if (sentAccessToken && useAuthStore.getState().accessToken !== sentAccessToken) {
        result = await baseQuery(requestArgs, apiContext, extraOptions);
      } else {
        const refreshResult = await refreshAuthSession();
        if (refreshResult.status === 'refreshed' || refreshResult.status === 'superseded') {
          if (
            useAuthStore.getState().user?.id === sentUserId &&
            useAuthStore.getState().accessToken
          ) {
            result = await baseQuery(requestArgs, apiContext, extraOptions);
          }
        } else if (refreshResult.status === 'invalid') {
          // Only a confirmed invalid refresh session clears local credentials.
          clearApiInFlightRequests();
          apiContext.dispatch(api.util.resetApiState());
          useAuthStore.getState().logout();
          TheAduseiErrorResponse('Your session has expired. Please log in again.');
        } else {
          result = {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Connection interrupted while renewing your session. Please retry.',
            },
          };
        }
      }
    }

    // Query screens do not all own a toast boundary. Surface the normalized server
    // message here so an inline fallback never hides the actionable API response.
    // Mutation consumers show their own contextual toast with the same shared parser.
    if (result.error && result.error.status !== 401 && apiContext.type === 'query') {
      TheAduseiErrorResponse(result.error, 'Failed to load data');
    }

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
