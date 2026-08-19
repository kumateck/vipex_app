import { ENV } from '@mobile/lib/env';
import { reportMobileErrorToDiscord } from '@mobile/lib/mobile-error-reporter';
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
import type {
  BranchOption,
  CreateBookingWithParcelsInput,
  CreateBookingWithParcelsResponse,
  CustomerLookupResult,
  LocationOption,
} from '@mobile/types/booking';

function normalizeBaseUrl(raw?: string): string {
  const fallback = 'http://127.0.0.1:3000';
  const base = (raw && raw.trim().length > 0 ? raw : fallback).replace(/\/+$/, '');
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

const API_BASE_URL_CANDIDATES = [ENV.apiBaseUrl]
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

export class ApiRequestError extends Error {
  status: number | null;
  url: string;
  details?: Record<string, unknown>;
  constructor(
    message: string,
    input: { status: number | null; url: string; details?: Record<string, unknown> },
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = input.status;
    this.url = input.url;
    this.details = input.details;
  }
}

function logMobileApiError(input: {
  method: string;
  path: string;
  url: string;
  activeBaseUrl: string;
  candidateBaseUrl: string;
  status?: number | null;
  message: string;
  responseBody?: unknown;
  attempt: number;
}) {
  const payload = {
    method: input.method,
    path: input.path,
    endpoint: input.url,
    status: input.status ?? null,
    message: input.message,
    responseBody: input.responseBody ?? null,
    activeBaseUrl: input.activeBaseUrl,
    candidateBaseUrl: input.candidateBaseUrl,
    attempt: input.attempt,
    at: new Date().toISOString(),
  };
  console.error('[mobile-api] request failed', payload);
  reportMobileErrorToDiscord({
    source: 'mobile-api',
    message: input.message,
    context: payload,
  });
}

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
  const method = options.method ?? 'GET';

  let attempt = 0;
  for (const baseUrl of [
    activeApiBaseUrl,
    ...API_BASE_URL_CANDIDATES.filter((u) => u !== activeApiBaseUrl),
  ]) {
    attempt += 1;
    const targetUrl = `${baseUrl}${options.path}${toQueryString(options.query)}`;
    try {
      const controller = new AbortController();
      const timeoutMs = options.timeoutMs ?? 15000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(targetUrl, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = (await response.json().catch(() => null)) as {
        error?: { message?: string; details?: Record<string, unknown> };
      } | null;

      if (!response.ok) {
        const serverMessage = json?.error?.message?.trim();
        logMobileApiError({
          method,
          path: options.path,
          url: targetUrl,
          activeBaseUrl: activeApiBaseUrl,
          candidateBaseUrl: baseUrl,
          status: response.status,
          message: serverMessage || 'Request failed',
          responseBody: json,
          attempt,
        });
        throw new ApiRequestError(`${serverMessage || 'Request failed'} (${response.status})`, {
          status: response.status,
          url: targetUrl,
          details: json?.error?.details,
        });
      }

      activeApiBaseUrl = baseUrl;
      return json as T;
    } catch (error) {
      if (error instanceof ApiRequestError) {
        lastError = error;
        continue;
      }
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
      logMobileApiError({
        method,
        path: options.path,
        url: targetUrl,
        activeBaseUrl: activeApiBaseUrl,
        candidateBaseUrl: baseUrl,
        status: null,
        message,
        attempt,
      });
      lastError = new Error(message);
    }
  }

  throw lastError ?? new Error('Network request failed');
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

const inFlightRefreshByToken = new Map<
  string,
  Promise<TokenPair & { user?: SessionState['user'] }>
>();

async function refreshTokenOnce(
  refreshTokenValue: string,
): Promise<TokenPair & { user?: SessionState['user'] }> {
  const existing = inFlightRefreshByToken.get(refreshTokenValue);
  if (existing) {
    return existing;
  }

  const promise = refreshToken(refreshTokenValue).finally(() => {
    if (inFlightRefreshByToken.get(refreshTokenValue) === promise) {
      inFlightRefreshByToken.delete(refreshTokenValue);
    }
  });
  inFlightRefreshByToken.set(refreshTokenValue, promise);

  return promise;
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
  const payload = await request<unknown>({
    path: `/shipments/parcels/${parcelId}/details`,
    token: accessToken,
  });
  const candidate =
    typeof payload === 'object' && payload !== null && 'data' in payload
      ? (payload as { data?: unknown }).data
      : payload;

  const details = candidate as Partial<ParcelFullDetails> | null;
  if (!details?.parcel) {
    throw new Error('Parcel details response missing parcel object');
  }

  return {
    ...(details as ParcelFullDetails),
    parcel: details.parcel,
    pickupQueue: details.pickupQueue ?? null,
    delivery: details.delivery ?? null,
    payments: Array.isArray(details.payments) ? details.payments : [],
    consignments: Array.isArray(details.consignments) ? details.consignments : [],
    internalHolder: details.internalHolder ?? null,
    dispositionActions: Array.isArray(details.dispositionActions) ? details.dispositionActions : [],
    storageWaivers: Array.isArray(details.storageWaivers) ? details.storageWaivers : [],
    storageSettlement: details.storageSettlement ?? null,
  };
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

export type IncomingConsignment = {
  id: string;
  code: string;
  sourceId: string;
  sourceName: string;
  destinationId: string;
  consignmentDate: string;
  serialForDay: number;
  status: number;
  closedBy: string | null;
  closedAt: string | null;
  closedWithExceptions: boolean;
  closeExceptionReason: string | null;
  arrived: number;
  total: number;
};

export type ConsignmentDetail = Omit<IncomingConsignment, 'sourceName'> & { companyId: string };

export type ConsignmentItem = {
  parcelId: string;
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  senderName: string;
  receiverName: string;
  addedAt: string;
  arrivedAt: string | null;
  arrivedBy: string | null;
  arrivedByName: string | null;
};

export type ReceiveConsignmentItemResult =
  | { outcome: 'RECEIVED'; parcelId: string; trackingCode: string; arrived: number; total: number }
  | {
      outcome: 'ALREADY_RECEIVED';
      parcelId: string;
      trackingCode: string;
      arrivedAt: string;
      arrivedByName: string | null;
    }
  | {
      outcome: 'WRONG_CONSIGNMENT';
      parcelId: string;
      trackingCode: string;
      belongsToConsignmentId: string | null;
      belongsToConsignmentCode: string | null;
    }
  | {
      outcome: 'NOT_DISPATCHED';
      parcelId: string;
      trackingCode: string;
      sourceBranchId: string;
      sourceBranchName: string | null;
    };

export type CloseConsignmentResult = {
  status: number;
  arrived: number;
  total: number;
  missingParcelIds: string[];
};

export async function listIncomingConsignments(
  accessToken: string,
  input: { companyId: string; destinationId: string },
): Promise<IncomingConsignment[]> {
  return request<IncomingConsignment[]>({
    path: '/shipments/consignments/incoming',
    token: accessToken,
    query: { companyId: input.companyId, destinationId: input.destinationId },
  });
}

export async function getConsignmentDetail(
  accessToken: string,
  consignmentId: string,
): Promise<ConsignmentDetail> {
  return request<ConsignmentDetail>({
    path: `/shipments/consignments/${consignmentId}`,
    token: accessToken,
  });
}

export async function listConsignmentItems(
  accessToken: string,
  consignmentId: string,
): Promise<ConsignmentItem[]> {
  return request<ConsignmentItem[]>({
    path: `/shipments/consignments/${consignmentId}/items`,
    token: accessToken,
  });
}

export async function receiveConsignmentItem(
  accessToken: string,
  consignmentId: string,
  code: string,
): Promise<ReceiveConsignmentItemResult> {
  return request<ReceiveConsignmentItemResult>({
    path: `/shipments/consignments/${consignmentId}/receive`,
    method: 'POST',
    token: accessToken,
    body: { code },
  });
}

export async function closeConsignment(
  accessToken: string,
  consignmentId: string,
  input?: { forceWithExceptions?: boolean; exceptionReason?: string },
): Promise<CloseConsignmentResult> {
  return request<CloseConsignmentResult>({
    path: `/shipments/consignments/${consignmentId}/close`,
    method: 'POST',
    token: accessToken,
    body: {
      forceWithExceptions: input?.forceWithExceptions,
      exceptionReason: input?.exceptionReason,
    },
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

export async function findCustomersByTelephone(
  accessToken: string,
  input: { telephone: string; limit?: number },
): Promise<CustomerLookupResult[]> {
  const payload = await request<unknown>({
    path: `/customers/lookup/by-telephone/${encodeURIComponent(input.telephone)}`,
    token: accessToken,
    query: { limit: input.limit ?? 10 },
  });
  const candidate =
    typeof payload === 'object' && payload !== null && 'data' in payload
      ? (payload as { data?: unknown }).data
      : payload;
  return Array.isArray(candidate) ? (candidate as CustomerLookupResult[]) : [];
}

export async function createCustomer(
  accessToken: string,
  input: { fullname: string; telephone: string; telephone2?: string | null },
): Promise<{ id: string }> {
  return request<{ id: string }>({
    path: '/customers',
    method: 'POST',
    token: accessToken,
    body: input,
  });
}

export async function listBranchOptions(
  accessToken: string,
  input: { companyId: string },
): Promise<BranchOption[]> {
  const payload = await request<unknown>({
    path: '/branches/options',
    token: accessToken,
    query: { companyId: input.companyId },
  });
  return Array.isArray(payload) ? (payload as BranchOption[]) : [];
}

export async function listLocationOptions(
  accessToken: string,
  input: { companyId: string; branchId: string },
): Promise<LocationOption[]> {
  const payload = await request<unknown>({
    path: '/locations/options',
    token: accessToken,
    query: { companyId: input.companyId, branchId: input.branchId },
  });
  return Array.isArray(payload) ? (payload as LocationOption[]) : [];
}

export async function createBookingWithParcels(
  accessToken: string,
  input: CreateBookingWithParcelsInput,
): Promise<CreateBookingWithParcelsResponse> {
  return request<CreateBookingWithParcelsResponse>({
    path: '/shipments/bookings/create-with-parcels',
    method: 'POST',
    token: accessToken,
    body: input,
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
    query: input
      ? {
          channelType: input.channelType,
          includeArchived: input.includeArchived,
        }
      : undefined,
  });
}

export async function createCommunicationChannel(
  accessToken: string,
  input: {
    name: string;
    description?: string | null;
    branchId?: string | null;
    locationId?: string | null;
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
    replyToMessageId?: string | null;
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
    body: {},
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
    body: {},
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
    const isUnauthorized =
      err.message.includes('401') || err.message.toLowerCase().includes('unauthorized');
    if (!isUnauthorized || !session.refreshToken) throw error;

    const refreshed = await refreshTokenOnce(session.refreshToken);
    const next: SessionState = {
      user: refreshed.user ?? session.user,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    };
    await updateSession(next);
    return run(next.accessToken!);
  }
}
