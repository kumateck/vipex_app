import { getCacheStore } from '@/server/services/cache';
import { TooManyRequests, Unauthorized } from '@/server/utils/http-error';
import type { AuthUser } from '@/server/plugins/auth';

/**
 * Shared per-user rate-limit factory for AI brief "generate" endpoints, which
 * are all far more expensive than a single API call (several report
 * aggregations + 1 LLM call). Per-user, not per-IP, matching the reasoning in
 * the original executive-insights/help-assistant rate limiters.
 */
export function createBriefRateLimit(opts: {
  cacheKeyPrefix: string;
  windowSeconds: number;
  maxRequests: number;
}) {
  return async ({ user }: { user: AuthUser | null }) => {
    if (!user) throw Unauthorized();
    const cache = getCacheStore();
    const key = `rl:${opts.cacheKeyPrefix}:${user.sub}`;
    const count = await cache.incr(key, opts.windowSeconds);
    if (count > opts.maxRequests) {
      throw TooManyRequests(
        'Too many regenerations in a short time. Please wait a while and try again.',
      );
    }
  };
}
