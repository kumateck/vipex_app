import { getCacheStore } from '@/server/services/cache';
import { env } from '@/server/utils/env';
import { TooManyRequests, Unauthorized } from '@/server/utils/http-error';
import type { AuthUser } from '@/server/plugins/auth';

/**
 * Per-user (not per-IP) rate limit, scoped to the help assistant only.
 * The shared global rate-limit plugin (src/server/middlewares/rate-limit.ts)
 * is keyed by IP+path with one budget shared across the whole API, which
 * doesn't control per-staff cost on this new paid external API — office
 * staff share IPs, and the global budget is already spent on normal traffic.
 */
export function helpAssistantRateLimit() {
  return async ({ user }: { user: AuthUser | null }) => {
    if (!user) throw Unauthorized();
    const cache = getCacheStore();
    const key = `rl:help-assistant:${user.sub}`;
    const count = await cache.incr(key, env.HELP_ASSISTANT_RATE_LIMIT_WINDOW_SECONDS);
    if (count > env.HELP_ASSISTANT_RATE_LIMIT_MAX_REQUESTS) {
      throw TooManyRequests(
        'Too many questions in a short time. Please wait a moment and try again.',
      );
    }
  };
}
