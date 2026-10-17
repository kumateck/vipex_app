import { Elysia, t } from 'elysia';
import type { CacheStore } from '@/server/services/cache/cache.types';
import { PublicContactBodySchema } from './schema';
import { createPublicContactService, type PublicContactDependencies } from './service';
import { assertContactOrigin, consumeContactQuota, CONTACT_WINDOW_SECONDS } from './abuse';

export function createPublicContactRoutes(deps: PublicContactDependencies, cache?: CacheStore) {
  const submit = createPublicContactService(deps);
  return new Elysia({ name: 'public-contact' })
    .onRequest(({ set }) => {
      set.headers['cache-control'] = 'no-store';
      set.headers['x-robots-tag'] = 'noindex, nofollow, nosnippet';
      set.headers['referrer-policy'] = 'no-referrer';
    })
    .post(
      '/v1/public/contact',
      async ({ body, set }) => {
        const result = await submit(body);
        set.status = 201;
        return result;
      },
      {
        body: PublicContactBodySchema,
        beforeHandle: async ({ request, set }) => {
          assertContactOrigin(request);
          if (await consumeContactQuota(request, cache)) return;
          set.status = 429;
          set.headers['retry-after'] = String(CONTACT_WINDOW_SECONDS);
          return {
            error: { code: 'RATE_LIMITED', message: 'Too many messages. Please try again later.' },
          };
        },
        response: {
          201: t.Object({ reference: t.String() }),
          429: t.Object({ error: t.Object({ code: t.String(), message: t.String() }) }),
        },
        detail: {
          tags: ['Public contact'],
          summary: 'Submit a website message to customer service',
        },
      },
    );
}
