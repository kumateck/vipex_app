import { Elysia } from 'elysia';
import { createHash } from 'node:crypto';
import { HttpStatus } from '../utils/http-status';
import { env } from '../utils/env';
import { getCacheStore } from '../services/cache';
import type { CacheStore } from '../services/cache/cache.types';
import { logger } from '../utils/logger';
import { verifyAccessToken } from '../utils/jwt';

type RateLimitOptions = {
  windowSeconds: number;
  maxRequests: number;
  staffReadMultiplier?: number;
  cache?: CacheStore;
};

const PUBLIC_PREFIXES = [
  '/v1/public/',
  '/v1/auth/',
  '/v1/self-service/',
  '/v1/desktop-updates/',
  '/v1/mobile-updates/',
];

async function isSignedAccessToken(authorization: string | null): Promise<boolean> {
  if (!authorization?.toLowerCase().startsWith('bearer ')) return false;
  const token = authorization.slice('bearer '.length).trim();
  if (!token) return false;
  try {
    await verifyAccessToken(token);
    return true;
  } catch {
    return false;
  }
}

function isStaffRead(path: string, method: string, signedAccessToken: boolean): boolean {
  const authenticatedProfileRead = path.startsWith('/v1/auth/me/');
  return (
    signedAccessToken &&
    method === 'GET' &&
    path.startsWith('/v1/') &&
    (authenticatedProfileRead || !PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix)))
  );
}

function toClientKey(
  ipHeader: string | null,
  authorization: string | null,
  path: string,
  method: string,
  signedAccessToken: boolean,
): string {
  if (signedAccessToken && authorization) {
    const fingerprint = createHash('sha256').update(authorization).digest('hex').slice(0, 24);
    return `rl:auth:${fingerprint}:${method}:${path}`;
  }
  const ip = (ipHeader || 'unknown').split(',')[0]?.trim() || 'unknown';
  return `rl:ip:${ip}:${method}:${path}`;
}

export function createRateLimitPlugin(options: RateLimitOptions) {
  return new Elysia({ name: 'rate-limit' }).as('global').onRequest(async ({ request, set }) => {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS' || path === '/health' || path.startsWith('/docs')) return;

    const authorization = request.headers.get('authorization');
    const signedAccessToken = await isSignedAccessToken(authorization);
    const staffRead = isStaffRead(path, request.method, signedAccessToken);
    const maxRequests = staffRead
      ? options.maxRequests * (options.staffReadMultiplier ?? 5)
      : options.maxRequests;

    const key = toClientKey(
      request.headers.get('x-forwarded-for'),
      authorization,
      path,
      request.method,
      signedAccessToken,
    );
    const cache = options.cache ?? getCacheStore();
    const count = await cache.incr(key, options.windowSeconds);

    set.headers['x-ratelimit-limit'] = String(maxRequests);
    set.headers['x-ratelimit-remaining'] = String(Math.max(maxRequests - count, 0));
    set.headers['x-ratelimit-window'] = String(options.windowSeconds);
    set.headers['x-ratelimit-policy'] = staffRead ? 'staff-read' : 'standard';

    if (count <= maxRequests) return;

    if (count === maxRequests + 1) {
      logger.warn('Rate limit exceeded', {
        method: request.method,
        path,
        policy: staffRead ? 'staff-read' : 'standard',
        limit: maxRequests,
        windowSeconds: options.windowSeconds,
      });
    }
    set.status = HttpStatus.TOO_MANY_REQUESTS;
    set.headers['retry-after'] = String(options.windowSeconds);
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
  staffReadMultiplier: env.RATE_LIMIT_STAFF_READ_MULTIPLIER,
};

export const rateLimit = createRateLimitPlugin(defaultRateLimitOptions);
