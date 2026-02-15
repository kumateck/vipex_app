import { Elysia } from 'elysia';
import { HttpStatus } from '../utils/http-status';
import { env } from '../utils/env';
import { getCacheStore } from '../services/cache';
import type { CacheStore } from '../services/cache/cache.types';

type RateLimitOptions = {
  windowSeconds: number;
  maxRequests: number;
  cache?: CacheStore;
};

function toClientKey(ipHeader: string | null, path: string): string {
  const ip = (ipHeader || 'unknown').split(',')[0]?.trim() || 'unknown';
  return `rl:${ip}:${path}`;
}

export function createRateLimitPlugin(options: RateLimitOptions) {
  return new Elysia({ name: 'rate-limit' }).as('global').onRequest(async ({ request, set }) => {
    const path = new URL(request.url).pathname;
    if (path === '/health' || path.startsWith('/docs')) return;

    const key = toClientKey(request.headers.get('x-forwarded-for'), path);
    const cache = options.cache ?? getCacheStore();
    const count = await cache.incr(key, options.windowSeconds);

    set.headers['x-ratelimit-limit'] = String(options.maxRequests);
    set.headers['x-ratelimit-remaining'] = String(Math.max(options.maxRequests - count, 0));
    set.headers['x-ratelimit-window'] = String(options.windowSeconds);

    if (count <= options.maxRequests) return;

    set.status = HttpStatus.TOO_MANY_REQUESTS;
    return {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please retry shortly.',
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    };
  });
}

export const defaultRateLimitOptions: RateLimitOptions = {
  windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
};

export const rateLimit = createRateLimitPlugin(defaultRateLimitOptions);
