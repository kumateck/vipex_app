import { createHash } from 'node:crypto';
import { getCacheStore } from '@/server/services/cache';
import type { CacheStore } from '@/server/services/cache/cache.types';
import { Forbidden } from '@/server/utils/http-error';

export const CONTACT_WINDOW_SECONDS = 15 * 60;
export const CONTACT_LIMIT = 5;
const WEBSITE_ORIGINS = new Set(['https://vipexparcels.com', 'https://www.vipexparcels.com']);

export function assertContactOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || WEBSITE_ORIGINS.has(origin)) return;
  if (
    process.env.NODE_ENV !== 'production' &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  ) {
    return;
  }
  throw Forbidden('This website cannot submit contact messages');
}

export async function consumeContactQuota(request: Request, cache: CacheStore = getCacheStore()) {
  // The deployment proxy must overwrite X-Forwarded-For; do not trust client-provided chains.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const digest = createHash('sha256').update(ip).digest('hex');
  return (
    (await cache.incr(`rl:website-contact:${digest}`, CONTACT_WINDOW_SECONDS)) <= CONTACT_LIMIT
  );
}
