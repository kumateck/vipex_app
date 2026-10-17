import { Elysia, t } from 'elysia';
import type { CacheStore } from '@/server/services/cache/cache.types';
import { getPublicParcelTrackingSvc } from './public-tracking.service';
import {
  consumeTrackingQuota,
  defaultTrackingQuota,
  type TrackingQuota,
} from './public-tracking.rate-limit';

const trackingParams = t.Object({ trackingCode: t.String({ minLength: 1, maxLength: 255 }) });

async function track({ params }: { params: { trackingCode: string } }) {
  return getPublicParcelTrackingSvc(params.trackingCode);
}

export function createPublicTrackingRoutes(
  quota: TrackingQuota = defaultTrackingQuota(),
  cache?: CacheStore,
) {
  return new Elysia({ name: 'public-tracking' }).get('/v1/public/tracking/:trackingCode', track, {
    params: trackingParams,
    beforeHandle: async ({ request, set }) => {
      if (await consumeTrackingQuota(request, quota, cache)) return;
      set.status = 429;
      set.headers['retry-after'] = String(quota.windowSeconds);
      return {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many tracking lookups. Please wait a few minutes and try again.',
        },
      };
    },
    detail: { tags: ['Public tracking'], summary: 'Track a parcel by tracking code' },
  });
}

export const publicTrackingRoutes = createPublicTrackingRoutes();
