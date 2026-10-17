import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { MemoryCacheStore } from '@/server/services/cache/memory-cache';
import { consumeTrackingQuota } from './public-tracking.rate-limit';
import { createPublicTrackingRoutes } from './public-tracking.routes';

const request = (ip: string) =>
  new Request('http://localhost/v1/public/tracking/ABC123', {
    headers: { 'x-forwarded-for': ip },
  });

describe('public tracking quota', () => {
  test('allows lookups up to the limit per IP, then refuses', async () => {
    const cache = new MemoryCacheStore();
    const quota = { windowSeconds: 600, maxRequests: 3 };
    for (let index = 0; index < 3; index += 1) {
      expect(await consumeTrackingQuota(request('10.1.0.1'), quota, cache)).toBe(true);
    }
    expect(await consumeTrackingQuota(request('10.1.0.1'), quota, cache)).toBe(false);
    // Another IP keeps its own budget.
    expect(await consumeTrackingQuota(request('10.1.0.2'), quota, cache)).toBe(true);
  });

  test('returns 429 with Retry-After before any lookup once the budget is spent', async () => {
    const cache = new MemoryCacheStore();
    const quota = { windowSeconds: 600, maxRequests: 1 };
    await consumeTrackingQuota(request('10.1.0.3'), quota, cache);
    const app = new Elysia().use(createPublicTrackingRoutes(quota, cache));

    const response = await app.handle(request('10.1.0.3'));

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('600');
    expect(await response.json()).toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });
});
