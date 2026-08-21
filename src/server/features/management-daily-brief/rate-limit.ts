import { createBriefRateLimit } from '@/server/services/ai-briefs/rate-limit';
import { env } from '@/server/utils/env';

export function managementDailyBriefRateLimit() {
  return createBriefRateLimit({
    cacheKeyPrefix: 'management-daily-brief',
    windowSeconds: env.MANAGEMENT_DAILY_BRIEF_RATE_LIMIT_WINDOW_SECONDS,
    maxRequests: env.MANAGEMENT_DAILY_BRIEF_RATE_LIMIT_MAX_REQUESTS,
  });
}
