import { getCacheStore } from '@/server/services/cache';
import { env } from '@/server/utils/env';
import { TooManyRequests, Unauthorized } from '@/server/utils/http-error';
import type { AuthUser } from '@/server/plugins/auth';

/**
 * Per-user rate limit on POST /messages — each turn can be up to 4 sequential
 * LLM round-trips, more expensive than either help-assistant or
 * executive-insights, so the budget is tighter per-request but sized to
 * still allow a real multi-question conversation.
 */
export function aiChatRateLimit() {
  return async ({ user }: { user: AuthUser | null }) => {
    if (!user) throw Unauthorized();
    const cache = getCacheStore();
    const key = `rl:ai-chat:${user.sub}`;
    const count = await cache.incr(key, env.AI_CHAT_RATE_LIMIT_WINDOW_SECONDS);
    if (count > env.AI_CHAT_RATE_LIMIT_MAX_REQUESTS) {
      throw TooManyRequests(
        'Too many messages in a short time. Please wait a while and try again.',
      );
    }
  };
}
