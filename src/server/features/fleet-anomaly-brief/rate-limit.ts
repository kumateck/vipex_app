import { createBriefRateLimit } from '@/server/services/ai-briefs/rate-limit';
import { env } from '@/server/utils/env';

export function fleetAnomalyBriefRateLimit() {
  return createBriefRateLimit({
    cacheKeyPrefix: 'fleet-anomaly-brief',
    windowSeconds: env.FLEET_ANOMALY_BRIEF_RATE_LIMIT_WINDOW_SECONDS,
    maxRequests: env.FLEET_ANOMALY_BRIEF_RATE_LIMIT_MAX_REQUESTS,
  });
}
