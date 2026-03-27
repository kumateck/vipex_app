import Constants from 'expo-constants';
import type { LoginResponse, SessionState, TokenPair } from '@/types/auth';
import type {
  ParcelFullDetails,
  ParcelSearchRow,
  PickupQueueCard,
  RiderDoorstepResponse,
} from '@/types/parcels';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };

function normalizeBaseUrl(raw?: string): string {
  const fallback = 'https://test.app.vipexparcel.com';
  const base = (raw && raw.trim().length > 0 ? raw : fallback).replace(/\/+$/, '');
  return `${base}/v1`;
}

const API_BASE_URL = normalizeBaseUrl(extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL);

type RequestOptions = {
  path: string;
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | null | undefined>;
};

function toQueryString(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || `${value}`.trim() === '') continue;
    params.set(key, String(value));
  }
  const raw = params.toString();
  return raw.length > 0 ? `?${raw}` : '';
}

async function request<T>(options: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${options.path}${toQueryString(options.query)}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;

  if (!response.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${response.status})`);
  }

  return json as T;
}

export async function login(email: string, password: string): Promise<SessionState> {
  const data = await request<LoginResponse>({
    path: '/auth/login',
    method: 'POST',
    body: { email, password },
  });

  const accessToken = data.tokens?.accessToken ?? data.accessToken ?? null;
  const refreshToken = data.tokens?.refreshToken ?? data.refreshToken ?? null;

  if (!accessToken || !refreshToken) {
    throw new Error('Login did not return valid tokens');
  }

  return {
    user: data.user,
    accessToken,
    refreshToken,
  };
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<TokenPair & { user?: SessionState['user'] }> {
  const data = await request<{ tokens: TokenPair; user?: SessionState['user'] }>({
    path: '/auth/refresh',
    method: 'POST',
    body: { refreshToken: refreshTokenValue },
  });

  return {
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
    user: data.user,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  await request<{ success: boolean }>({
    path: '/auth/forgot-password',
    method: 'POST',
    body: { email },
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await request<{ success: boolean }>({
    path: '/auth/reset-password',
    method: 'POST',
    body: { token, password },
  });
}

export async function changePassword(
  accessToken: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await request<{ success: boolean }>({
    path: '/auth/change-password',
    method: 'POST',
    token: accessToken,
    body: { oldPassword, newPassword },
  });
}

export async function searchParcels(
  accessToken: string,
  input: {
    search: string;
    companyId: string;
    destinationId?: string;
    status?: number;
    senderPaid?: boolean;
    page?: number;
    pageSize?: number;
  },
): Promise<{ data: ParcelSearchRow[] }> {
  return request<{ data: ParcelSearchRow[] }>({
    path: '/shipments/parcels',
    token: accessToken,
    query: {
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
      search: input.search,
      companyId: input.companyId,
      destinationId: input.destinationId,
      status: input.status,
      senderPaid: input.senderPaid,
    },
  });
}

export async function getParcelDetails(
  accessToken: string,
  parcelId: string,
): Promise<ParcelFullDetails> {
  return request<ParcelFullDetails>({
    path: `/shipments/parcels/${parcelId}`,
    token: accessToken,
  });
}

export async function updateParcelStatus(
  accessToken: string,
  parcelId: string,
  status: number,
): Promise<{ id: string }> {
  return request<{ id: string }>({
    path: `/shipments/parcels/${parcelId}`,
    method: 'PATCH',
    token: accessToken,
    body: { status },
  });
}

export async function updateParcel(
  accessToken: string,
  input: {
    id: string;
    parcelDetails?: string;
    parcelContent?: string;
    status?: number;
  },
): Promise<{ id: string }> {
  const { id, ...body } = input;
  return request<{ id: string }>({
    path: `/shipments/parcels/${id}`,
    method: 'PATCH',
    token: accessToken,
    body,
  });
}

export async function updateCustomer(
  accessToken: string,
  input: {
    id: string;
    fullname?: string;
    telephone?: string | null;
  },
): Promise<{ id: string }> {
  const { id, ...body } = input;
  return request<{ id: string }>({
    path: `/customers/${id}`,
    method: 'PATCH',
    token: accessToken,
    body,
  });
}

export async function createPickupQueue(
  accessToken: string,
  input: { parcelId: string },
): Promise<{ id: string; queueCode?: string }> {
  return request<{ id: string; queueCode?: string }>({
    path: '/pickup-queues',
    method: 'POST',
    token: accessToken,
    body: input,
  });
}

export async function listPickupQueueCards(
  accessToken: string,
  input: { branchId: string; paymentBucket?: 'SP' | 'TP' },
): Promise<PickupQueueCard[]> {
  return request<PickupQueueCard[]>({
    path: `/pickup-queues/branch/${input.branchId}/cards`,
    token: accessToken,
    query: input.paymentBucket ? { paymentBucket: input.paymentBucket } : undefined,
  });
}

export async function listRiderParcels(
  accessToken: string,
  riderUserId: string,
  mode: 'current' | 'history' = 'current',
): Promise<RiderDoorstepResponse> {
  return request<RiderDoorstepResponse>({
    path: `/deliveries/dd/rider/${riderUserId}`,
    token: accessToken,
    query: { mode },
  });
}

export async function riderGivenToCustomer(
  accessToken: string,
  input: { parcelId: string; riderUserId: string; signatureImage: string },
): Promise<{ id: string }> {
  return request<{ id: string }>({
    path: `/deliveries/dd/${input.parcelId}/rider-given`,
    method: 'POST',
    token: accessToken,
    body: {
      riderUserId: input.riderUserId,
      signatureImage: input.signatureImage,
    },
  });
}

export async function riderReturnedToOffice(
  accessToken: string,
  input: { parcelId: string; riderUserId: string },
): Promise<{ id: string }> {
  return request<{ id: string }>({
    path: `/deliveries/dd/${input.parcelId}/returned`,
    method: 'POST',
    token: accessToken,
    body: {
      riderUserId: input.riderUserId,
    },
  });
}

export async function authorizedRequestWithRefresh<T>(
  session: SessionState,
  run: (accessToken: string) => Promise<T>,
  updateSession: (next: SessionState) => Promise<void>,
): Promise<T> {
  if (!session.accessToken) throw new Error('Missing access token');

  try {
    return await run(session.accessToken);
  } catch (error) {
    const err = error as Error;
    if (!err.message.includes('401') || !session.refreshToken) throw error;

    const refreshed = await refreshToken(session.refreshToken);
    const next: SessionState = {
      user: refreshed.user ?? session.user,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    };
    await updateSession(next);
    return run(next.accessToken!);
  }
}
