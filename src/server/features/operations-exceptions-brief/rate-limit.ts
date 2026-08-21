import { createBriefRateLimit } from '@/server/services/ai-briefs/rate-limit';
import { env } from '@/server/utils/env';

export function operationsExceptionsBriefRateLimit() {
  return createBriefRateLimit({
    cacheKeyPrefix: 'operations-exceptions-brief',
    windowSeconds: env.OPERATIONS_EXCEPTIONS_BRIEF_RATE_LIMIT_WINDOW_SECONDS,
    maxRequests: env.OPERATIONS_EXCEPTIONS_BRIEF_RATE_LIMIT_MAX_REQUESTS,
  });
}
