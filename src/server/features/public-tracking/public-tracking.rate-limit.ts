import { createHash } from 'node:crypto';
import { getCacheStore } from '@/server/services/cache';
import type { CacheStore } from '@/server/services/cache/cache.types';
import { env } from '@/server/utils/env';

export type TrackingQuota = { windowSeconds: number; maxRequests: number };

export const defaultTrackingQuota = (): TrackingQuota => ({
  windowSeconds: env.PUBLIC_TRACKING_RATE_LIMIT_WINDOW_SECONDS,
  maxRequests: env.PUBLIC_TRACKING_RATE_LIMIT_MAX_REQUESTS,
});

/**
 * Per-IP budget for anonymous tracking lookups, separate from the global per-path quota, so
 * tracking codes cannot be enumerated at the global rate. Resolves to false once exhausted.
 */
export async function consumeTrackingQuota(
  request: Request,
  quota: TrackingQuota = defaultTrackingQuota(),
  cache: CacheStore = getCacheStore(),
): Promise<boolean> {
  // The deployment proxy must overwrite X-Forwarded-For; do not trust client-provided chains.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const digest = createHash('sha256').update(ip).digest('hex');
  const count = await cache.incr(`rl:public-tracking:${digest}`, quota.windowSeconds);
  return count <= quota.maxRequests;
}
