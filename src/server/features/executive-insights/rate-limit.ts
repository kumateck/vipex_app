import { createBriefRateLimit } from '@/server/services/ai-briefs/rate-limit';
import { env } from '@/server/utils/env';

/**
 * Per-user rate limit on POST /generate only — this call is far more
 * expensive than a Help Assistant question (5 report aggregations + 1 LLM
 * call), so the budget is tighter. Same per-user-not-per-IP reasoning as
 * src/server/features/help-assistant/rate-limit.ts.
 */
export function executiveInsightsRateLimit() {
  return createBriefRateLimit({
    cacheKeyPrefix: 'executive-insights',
    windowSeconds: env.EXECUTIVE_INSIGHTS_RATE_LIMIT_WINDOW_SECONDS,
    maxRequests: env.EXECUTIVE_INSIGHTS_RATE_LIMIT_MAX_REQUESTS,
  });
}
