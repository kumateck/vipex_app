import Constants from 'expo-constants';
import type { LoginResponse, SessionState, TokenPair } from '@mobile/types/auth';
import type {
  CommunicationCallSession,
  CommunicationChannel,
  CommunicationChannelUnreadCount,
  CommunicationEngagementRequest,
  CommunicationEngagementRequestTarget,
  CommunicationMessage,
  CommunicationThread,
  CommunicationUnreadCount,
  CommunicationVoiceJoin,
  MobileUserOption,
} from '@mobile/types/communication';
import type {
  ParcelFullDetails,
  RiderBenchmarkResponse,
  ParcelSearchRow,
  PickupQueueCard,
  RiderDoorstepResponse,
} from '@mobile/types/parcels';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };
const manifestExtra = ((
  Constants as unknown as {
    manifest2?: { extra?: { expoClient?: { extra?: { apiBaseUrl?: string } } } };
  }
).manifest2?.extra?.expoClient?.extra ?? {}) as { apiBaseUrl?: string };

function normalizeBaseUrl(raw?: string): string {
  const fallback = 'https://testing.app.vipexparcel.com';
  const base = (raw && raw.trim().length > 0 ? raw : fallback).replace(/\/+$/, '');
  return `${base}/v1`;
}

const API_BASE_URL_CANDIDATES = [
  extra.apiBaseUrl,
  manifestExtra.apiBaseUrl,
  process.env.EXPO_PUBLIC_API_BASE_URL,
  'https://testing.app.vipexparcel.com',
]
  .map((entry) => normalizeBaseUrl(entry))
  .filter((entry, index, all) => all.indexOf(entry) === index);

let activeApiBaseUrl = API_BASE_URL_CANDIDATES[0] ?? normalizeBaseUrl();

export function getApiDebugInfo() {
  return {
    activeApiBaseUrl,
    candidates: API_BASE_URL_CANDIDATES,
  };
}

export type ApiProbeResult = {
  apiBaseUrl: string;
  healthUrl: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error: string | null;
};

function toRootUrlFromV1(baseV1Url: string) {
  try {
    const parsed = new URL(baseV1Url);
    parsed.pathname = parsed.pathname.replace(/\/v1\/?$/, '');
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return baseV1Url.replace(/\/v1\/?$/, '');
  }
}

async function probeHealth(
  healthUrl: string,
): Promise<Omit<ApiProbeResult, 'apiBaseUrl' | 'healthUrl'>> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return {
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - started,
      error: null,
    };
  } catch (error) {
    clearTimeout(timeout);
    const isAbort =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError';
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: isAbort ? 'timeout' : error instanceof Error ? error.message : 'network_error',
    };
  }
}

export async function runApiDiagnostics(): Promise<{
  activeApiBaseUrl: string;
  probes: ApiProbeResult[];
}> {
  const probes: ApiProbeResult[] = [];
  for (const apiBaseUrl of API_BASE_URL_CANDIDATES) {
    const rootUrl = toRootUrlFromV1(apiBaseUrl);
    const healthUrl = `${rootUrl}/health`;
    const result = await probeHealth(healthUrl);
    probes.push({
      apiBaseUrl,
      healthUrl,
      ...result,
    });
  }
  return {
    activeApiBaseUrl,
    probes,
  };
}

type RequestOptions = {
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | null | undefined>;
  timeoutMs?: number;
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
  let lastError: Error | null = null;
  const attemptedUrls: string[] = [];

  for (const baseUrl of [
    activeApiBaseUrl,
    ...API_BASE_URL_CANDIDATES.filter((u) => u !== activeApiBaseUrl),
  ]) {
    const targetUrl = `${baseUrl}${options.path}${toQueryString(options.query)}`;
    attemptedUrls.push(targetUrl);
    try {
      const controller = new AbortController();
      const timeoutMs = options.timeoutMs ?? 15000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(targetUrl, {
        method: options.method ?? 'GET',
        headers: {
          'content-type': 'application/json',
          ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        throw new Error(
          json?.error?.message ?? `Request failed (${response.status}) at ${targetUrl}`,
        );
      }

      activeApiBaseUrl = baseUrl;
      return json as T;
    } catch (error) {
      const isAbort =
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name?: string }).name === 'AbortError';
      const message = isAbort
        ? 'Request timed out'
        : error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'Network request failed';
      lastError = new Error(`${message} (while calling ${targetUrl})`);
    }
  }

  throw lastError ?? new Error(`Network request failed. Attempted: ${attemptedUrls.join(' | ')}`);
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

export async function resetPassword(email: string, otp: string, password: string): Promise<void> {
  await request<{ success: boolean }>({
    path: '/auth/reset-password',
    method: 'POST',
    body: { email, otp, password },
  });
}

export async function setPassword(email: string, otp: string, password: string): Promise<void> {
  await request<{ success: boolean }>({
    path: '/auth/set-password',
    method: 'POST',
    body: { email, otp, password },
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
    includeDeleted?: boolean;
    page?: number;
    pageSize?: number;
  },
): Promise<{ data: ParcelSearchRow[]; meta?: { totalRecords?: number; totalPages?: number } }> {
  return request<{
    data: ParcelSearchRow[];
    meta?: { totalRecords?: number; totalPages?: number };
  }>({
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
      includeDeleted: input.includeDeleted,
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

export async function getRiderBranchBenchmark(
  accessToken: string,
  input: { riderUserId: string; branchId: string },
): Promise<RiderBenchmarkResponse> {
  return request<RiderBenchmarkResponse>({
    path: `/deliveries/dd/rider/${input.riderUserId}/benchmark`,
    token: accessToken,
    query: { branchId: input.branchId },
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

export async function listCommunicationThreads(
  accessToken: string,
  input?: { threadType?: 'direct' | 'group' | 'channel' },
): Promise<CommunicationThread[]> {
  return request<CommunicationThread[]>({
    path: '/communication/threads',
    token: accessToken,
    query: input?.threadType ? { threadType: input.threadType } : undefined,
  });
}

export async function createCommunicationThread(
  accessToken: string,
  input: {
    threadType: 'direct' | 'group' | 'channel';
    title?: string | null;
    participantUserIds: string[];
    branchId?: string | null;
    locationId?: string | null;
  },
): Promise<CommunicationThread> {
  return request<CommunicationThread>({
    path: '/communication/threads',
    method: 'POST',
    token: accessToken,
    body: input,
  });
}

export async function listCommunicationChannels(
  accessToken: string,
  input?: { channelType?: 'text' | 'voice'; includeArchived?: boolean },
): Promise<CommunicationChannel[]> {
  return request<CommunicationChannel[]>({
    path: '/communication/channels',
    token: accessToken,
    query: {
      channelType: input?.channelType,
      includeArchived: input?.includeArchived ?? false,
    },
  });
}

export async function createCommunicationChannel(
  accessToken: string,
  input: {
    name: string;
    description?: string | null;
    channelType?: 'text' | 'voice';
    visibility?: 'public' | 'private';
    participantUserIds?: string[];
    isCallEnabled?: boolean;
    isAnnouncementOnly?: boolean;
    maxParticipants?: number | null;
  },
): Promise<CommunicationChannel> {
  return request<CommunicationChannel>({
    path: '/communication/channels',
    method: 'POST',
    token: accessToken,
    body: input,
  });
}

export async function updateCommunicationChannel(
  accessToken: string,
  input: {
    id: string;
    name?: string | null;
    description?: string | null;
    isArchived?: boolean;
    isCallEnabled?: boolean;
    isAnnouncementOnly?: boolean;
    maxParticipants?: number | null;
  },
): Promise<CommunicationChannel> {
  const { id, ...body } = input;
  return request<CommunicationChannel>({
    path: `/communication/channels/${id}`,
    method: 'PATCH',
    token: accessToken,
    body,
  });
}

export async function addCommunicationChannelParticipants(
  accessToken: string,
  input: { id: string; participantUserIds: string[] },
): Promise<CommunicationChannel> {
  return request<CommunicationChannel>({
    path: `/communication/channels/${input.id}/participants`,
    method: 'POST',
    token: accessToken,
    body: { participantUserIds: input.participantUserIds },
  });
}

export async function removeCommunicationChannelParticipant(
  accessToken: string,
  input: { id: string; userId: string },
): Promise<CommunicationChannel> {
  return request<CommunicationChannel>({
    path: `/communication/channels/${input.id}/participants/${input.userId}`,
    method: 'DELETE',
    token: accessToken,
  });
}

export async function listCommunicationMessages(
  accessToken: string,
  input: { threadId: string; limit?: number },
): Promise<CommunicationMessage[]> {
  return request<CommunicationMessage[]>({
    path: '/communication/messages',
    token: accessToken,
    query: {
      threadId: input.threadId,
      limit: input.limit ?? 100,
    },
  });
}

export async function createCommunicationMessage(
  accessToken: string,
  input: {
    threadId: string;
    body?: string | null;
    messageType?: string | null;
    metadataJson?: Record<string, unknown> | null;
  },
): Promise<CommunicationMessage> {
  return request<CommunicationMessage>({
    path: '/communication/messages',
    method: 'POST',
    token: accessToken,
    body: input,
  });
}

export async function listCommunicationUnreadCounts(
  accessToken: string,
): Promise<CommunicationUnreadCount[]> {
  return request<CommunicationUnreadCount[]>({
    path: '/communication/messages/unread-counts',
    token: accessToken,
  });
}

export async function markCommunicationThreadRead(
  accessToken: string,
  input: { threadId: string },
): Promise<{ threadId: string; readAt: string | null }> {
  return request<{ threadId: string; readAt: string | null }>({
    path: '/communication/messages/read',
    method: 'POST',
    token: accessToken,
    body: input,
  });
}

export async function listCommunicationChannelUnreadCounts(
  accessToken: string,
  input?: { channelType?: 'text' | 'voice' },
): Promise<CommunicationChannelUnreadCount[]> {
  return request<CommunicationChannelUnreadCount[]>({
    path: '/communication/channels/unread-counts',
    token: accessToken,
    query: {
      channelType: input?.channelType,
    },
  });
}

export async function markCommunicationChannelRead(
  accessToken: string,
  input: { id: string },
): Promise<{ channelId: string; readAt: string | null }> {
  return request<{ channelId: string; readAt: string | null }>({
    path: `/communication/channels/${input.id}/read`,
    method: 'POST',
    token: accessToken,
  });
}

export async function listCommunicationCalls(
  accessToken: string,
  input?: { status?: string; channelId?: string; threadId?: string },
): Promise<CommunicationCallSession[]> {
  return request<CommunicationCallSession[]>({
    path: '/communication/calls',
    token: accessToken,
    query: {
      status: input?.status,
      channelId: input?.channelId,
      threadId: input?.threadId,
    },
  });
}

export async function joinCommunicationVoiceChannel(
  accessToken: string,
  input: { channelId: string },
): Promise<CommunicationVoiceJoin> {
  return request<CommunicationVoiceJoin>({
    path: `/communication/calls/voice/${input.channelId}/join`,
    method: 'POST',
    token: accessToken,
  });
}

export async function listMobileUserOptions(accessToken: string): Promise<MobileUserOption[]> {
  return request<MobileUserOption[]>({
    path: '/users/options',
    token: accessToken,
  });
}

export async function listCommunicationEngagementRequestTargets(
  accessToken: string,
): Promise<CommunicationEngagementRequestTarget[]> {
  return request<CommunicationEngagementRequestTarget[]>({
    path: '/communication/engagement-requests/targets',
    token: accessToken,
  });
}

export async function listCommunicationEngagementRequests(
  accessToken: string,
  input?: {
    view?: 'incoming' | 'outgoing' | 'all';
    status?: 'pending' | 'approved' | 'declined';
  },
): Promise<CommunicationEngagementRequest[]> {
  return request<CommunicationEngagementRequest[]>({
    path: '/communication/engagement-requests',
    token: accessToken,
    query: {
      view: input?.view,
      status: input?.status,
    },
  });
}

export async function createCommunicationEngagementRequest(
  accessToken: string,
  input: {
    targetUserId: string;
    reasonCode?: string | null;
    reasonNote?: string | null;
    linkedEntityType?: string | null;
    linkedEntityId?: string | null;
    scope?: 'temporary' | 'persistent';
    expiresAt?: string | null;
  },
): Promise<CommunicationEngagementRequest> {
  return request<CommunicationEngagementRequest>({
    path: '/communication/engagement-requests',
    method: 'POST',
    token: accessToken,
    body: input,
  });
}

export async function approveCommunicationEngagementRequest(
  accessToken: string,
  input: { id: string },
): Promise<CommunicationEngagementRequest> {
  return request<CommunicationEngagementRequest>({
    path: `/communication/engagement-requests/${input.id}/approve`,
    method: 'POST',
    token: accessToken,
  });
}

export async function declineCommunicationEngagementRequest(
  accessToken: string,
  input: { id: string },
): Promise<CommunicationEngagementRequest> {
  return request<CommunicationEngagementRequest>({
    path: `/communication/engagement-requests/${input.id}/decline`,
    method: 'POST',
    token: accessToken,
  });
}

export async function registerCommunicationPushToken(
  accessToken: string,
  input: { token: string; platform: 'ios' | 'android' | 'web' },
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>({
    path: '/communication/push/register',
    method: 'POST',
    token: accessToken,
    body: input,
  });
}

export async function unregisterCommunicationPushToken(
  accessToken: string,
  input: { token: string },
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>({
    path: '/communication/push/unregister',
    method: 'POST',
    token: accessToken,
    body: input,
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
