import { resolveWhatsAppConfig } from '../notification-hub/providers';

const GRAPH_API_ROOT = 'https://graph.facebook.com';
const REQUEST_TIMEOUT_MS = 15_000;
const DAY_SECONDS = 86_400;

export type MetaSpendByCategory = { category: string; volume: number; cost: number };

export type MetaSpendResult =
  | { available: true; currency: string | null; total: number; byCategory: MetaSpendByCategory[] }
  | { available: false; error: string };

/** Unix seconds for [from 00:00 UTC, day after `to` 00:00 UTC), capped at now. */
export function metaSpendWindow(from: string, to: string, nowMs = Date.now()) {
  const start = Math.floor(Date.parse(`${from}T00:00:00Z`) / 1000);
  const end = Math.floor(Date.parse(`${to}T00:00:00Z`) / 1000) + DAY_SECONDS;
  return { start, end: Math.min(end, Math.floor(nowMs / 1000)) };
}

type PricingPayload = {
  currency?: unknown;
  pricing_analytics?: { data?: Array<{ data_points?: Array<Record<string, unknown>> }> };
  error?: { message?: unknown; code?: unknown };
};

/** Sums Meta's pricing analytics data points by pricing category. */
export function summarizeMetaPricing(payload: PricingPayload) {
  const totals = new Map<string, MetaSpendByCategory>();
  for (const series of payload.pricing_analytics?.data ?? []) {
    for (const point of series.data_points ?? []) {
      const category = String(point.pricing_category ?? 'unknown').toLowerCase();
      const entry = totals.get(category) ?? { category, volume: 0, cost: 0 };
      entry.volume += Number(point.volume ?? 0) || 0;
      entry.cost += Number(point.cost ?? 0) || 0;
      totals.set(category, entry);
    }
  }
  const byCategory = [...totals.values()].sort((a, b) => b.cost - a.cost);
  return {
    currency: typeof payload.currency === 'string' ? payload.currency : null,
    total: byCategory.reduce((sum, item) => sum + item.cost, 0),
    byCategory,
  };
}

/** Reads what Meta charged the WhatsApp Business Account for a period. */
export async function fetchMetaWhatsAppSpend(
  input: { config: unknown; from: string; to: string },
  request: typeof fetch = fetch,
): Promise<MetaSpendResult> {
  const config = resolveWhatsAppConfig(input.config);
  if (!config.accessToken || !config.wabaId) {
    return { available: false, error: 'Add the WhatsApp Business Account ID in WhatsApp Settings' };
  }
  const { start, end } = metaSpendWindow(input.from, input.to);
  if (end <= start) return { available: true, currency: null, total: 0, byCategory: [] };

  const fields =
    `currency,pricing_analytics.start(${start}).end(${end})` +
    `.granularity(DAILY).dimensions(["PRICING_CATEGORY"])`;
  const url =
    `${GRAPH_API_ROOT}/${config.apiVersion}/${encodeURIComponent(config.wabaId)}` +
    `?fields=${encodeURIComponent(fields)}`;
  try {
    const response = await request(url, {
      headers: { authorization: `Bearer ${config.accessToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const payload = (await response.json().catch(() => null)) as PricingPayload | null;
    if (!response.ok || !payload || payload.error) {
      const detail =
        typeof payload?.error?.message === 'string' ? payload.error.message : 'No detail';
      const message = `Meta returned ${response.status} (code ${String(payload?.error?.code ?? 'n/a')}): ${detail}`;
      return { available: false, error: message.replaceAll(config.accessToken, '[REDACTED]') };
    }
    return { available: true, ...summarizeMetaPricing(payload) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { available: false, error: `Could not reach Meta: ${reason}`.slice(0, 300) };
  }
}
