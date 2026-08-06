import { getItemAsync, setItemAsync } from '@mobile/lib/secure-store-compat';
import { reportMobileErrorToDiscord } from '@mobile/lib/mobile-error-reporter';
import type { CommunicationMessage } from '@mobile/types/communication';

const THREAD_CACHE_PREFIX = 'vipex_mobile_comm_thread_cache_v1_';
const THREAD_QUEUE_PREFIX = 'vipex_mobile_comm_thread_queue_v1_';
const LEGACY_THREAD_CACHE_PREFIX = 'vipex_mobile_comm_thread_cache_v1:';
const LEGACY_THREAD_QUEUE_PREFIX = 'vipex_mobile_comm_thread_queue_v1:';
const CHANNEL_PREFS_KEY = 'vipex_mobile_comm_channel_notif_prefs_v1';
const GLOBAL_SEARCH_HISTORY_KEY = 'vipex_mobile_global_search_history_v1';
const THREAD_FAVOURITES_KEY = 'vipex_mobile_comm_thread_favourites_v1';

export type PendingThreadMessage = {
  tempId: string;
  body: string;
  createdAt: string;
  metadataJson?: unknown;
  replyToMessageId?: string | null;
};

export type ChannelNotificationMode = 'all' | 'mentions' | 'mute';

export type ChannelNotificationPrefs = Record<string, ChannelNotificationMode>;

function sanitizeKeySegment(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.length > 0 ? cleaned : 'unknown';
}

function hashKeySegment(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16);
}

function buildScopedStoreKey(prefix: string, threadId: string) {
  const normalized = sanitizeKeySegment(threadId);
  const suffix = normalized.slice(0, 48);
  return `${prefix}${hashKeySegment(threadId)}_${suffix}`;
}

function isValidSecureStoreKey(key: string) {
  return key.length > 0 && /^[a-zA-Z0-9._-]+$/.test(key);
}

function logStorageError(message: string, context: Record<string, unknown>) {
  const payload = { ...context, at: new Date().toISOString() };
  console.error('[mobile-storage] secure-store failed', payload);
  reportMobileErrorToDiscord({
    source: 'mobile-storage',
    message,
    context: payload,
  });
}

async function safeGetItem(key: string): Promise<string | null> {
  if (!isValidSecureStoreKey(key)) return null;
  try {
    return await getItemAsync(key);
  } catch (error) {
    logStorageError('secure storage getItem failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  if (!isValidSecureStoreKey(key)) return;
  try {
    await setItemAsync(key, value);
  } catch (error) {
    logStorageError('secure storage setItem failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function threadCacheKey(threadId: string) {
  return buildScopedStoreKey(THREAD_CACHE_PREFIX, threadId);
}

function threadQueueKey(threadId: string) {
  return buildScopedStoreKey(THREAD_QUEUE_PREFIX, threadId);
}

function previousThreadCacheKey(threadId: string) {
  return `${THREAD_CACHE_PREFIX}${sanitizeKeySegment(threadId)}`;
}

function previousThreadQueueKey(threadId: string) {
  return `${THREAD_QUEUE_PREFIX}${sanitizeKeySegment(threadId)}`;
}

function legacyThreadCacheKey(threadId: string) {
  return `${LEGACY_THREAD_CACHE_PREFIX}${sanitizeKeySegment(threadId)}`;
}

function legacyThreadQueueKey(threadId: string) {
  return `${LEGACY_THREAD_QUEUE_PREFIX}${sanitizeKeySegment(threadId)}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadThreadMessageCache(threadId: string): Promise<CommunicationMessage[]> {
  if (!threadId) return [];
  const key = threadCacheKey(threadId);
  let raw = await safeGetItem(key);
  if (!raw) {
    const previousRaw = await safeGetItem(previousThreadCacheKey(threadId));
    if (previousRaw) {
      raw = previousRaw;
      await safeSetItem(key, previousRaw);
    }
  }
  if (!raw) {
    const legacyRaw = await safeGetItem(legacyThreadCacheKey(threadId));
    if (legacyRaw) {
      raw = legacyRaw;
      await safeSetItem(key, legacyRaw);
    }
  }
  return safeParse<CommunicationMessage[]>(raw, []);
}

export async function saveThreadMessageCache(
  threadId: string,
  messages: CommunicationMessage[],
): Promise<void> {
  if (!threadId) return;
  const compact = messages
    .filter((message) => Boolean(message.id))
    .slice(-80)
    .map((message) => ({
      ...message,
      body: message.body ?? '',
    }));
  await safeSetItem(threadCacheKey(threadId), JSON.stringify(compact));
}

export async function loadPendingThreadQueue(threadId: string): Promise<PendingThreadMessage[]> {
  if (!threadId) return [];
  const key = threadQueueKey(threadId);
  let raw = await safeGetItem(key);
  if (!raw) {
    const previousRaw = await safeGetItem(previousThreadQueueKey(threadId));
    if (previousRaw) {
      raw = previousRaw;
      await safeSetItem(key, previousRaw);
    }
  }
  if (!raw) {
    const legacyRaw = await safeGetItem(legacyThreadQueueKey(threadId));
    if (legacyRaw) {
      raw = legacyRaw;
      await safeSetItem(key, legacyRaw);
    }
  }
  return safeParse<PendingThreadMessage[]>(raw, []);
}

export async function savePendingThreadQueue(
  threadId: string,
  queue: PendingThreadMessage[],
): Promise<void> {
  if (!threadId) return;
  await safeSetItem(threadQueueKey(threadId), JSON.stringify(queue.slice(-30)));
}

export async function enqueuePendingThreadMessage(
  threadId: string,
  item: PendingThreadMessage,
): Promise<void> {
  const queue = await loadPendingThreadQueue(threadId);
  queue.push(item);
  await savePendingThreadQueue(threadId, queue);
}

export async function removePendingThreadMessage(threadId: string, tempId: string): Promise<void> {
  const queue = await loadPendingThreadQueue(threadId);
  const next = queue.filter((entry) => entry.tempId !== tempId);
  await savePendingThreadQueue(threadId, next);
}

export async function loadChannelNotificationPrefs(): Promise<ChannelNotificationPrefs> {
  const raw = await safeGetItem(CHANNEL_PREFS_KEY);
  return safeParse<ChannelNotificationPrefs>(raw, {});
}

export async function saveChannelNotificationPrefs(prefs: ChannelNotificationPrefs): Promise<void> {
  await safeSetItem(CHANNEL_PREFS_KEY, JSON.stringify(prefs));
}

export async function loadGlobalSearchHistory(): Promise<string[]> {
  const raw = await safeGetItem(GLOBAL_SEARCH_HISTORY_KEY);
  const parsed = safeParse<string[]>(raw, []);
  return parsed.filter((entry) => entry.trim().length > 0).slice(0, 8);
}

export async function pushGlobalSearchHistory(term: string): Promise<void> {
  const trimmed = term.trim();
  if (!trimmed) return;
  const current = await loadGlobalSearchHistory();
  const deduped = [
    trimmed,
    ...current.filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase()),
  ];
  await safeSetItem(GLOBAL_SEARCH_HISTORY_KEY, JSON.stringify(deduped.slice(0, 8)));
}

export async function loadThreadFavourites(): Promise<Record<string, boolean>> {
  const raw = await safeGetItem(THREAD_FAVOURITES_KEY);
  return safeParse<Record<string, boolean>>(raw, {});
}

export async function saveThreadFavourites(next: Record<string, boolean>): Promise<void> {
  await safeSetItem(THREAD_FAVOURITES_KEY, JSON.stringify(next));
}
