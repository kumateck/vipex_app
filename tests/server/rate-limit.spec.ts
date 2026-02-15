import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { createRateLimitPlugin } from '../../src/server/middlewares/rate-limit';
import { MemoryCacheStore } from '../../src/server/services/cache/memory-cache';
import { HttpStatus } from '../../src/server/utils/http-status';

const app = new Elysia()
  .use(
    createRateLimitPlugin({
      windowSeconds: 60,
      maxRequests: 3,
      cache: new MemoryCacheStore(),
    }),
  )
  .get('/limited', () => ({ ok: true }));

async function call(ip: string): Promise<Response> {
  return app.handle(
    new Request('http://localhost/limited', {
      method: 'GET',
      headers: {
        'x-forwarded-for': ip,
      },
    }),
  );
}

describe('Rate limit middleware', () => {
  test('allows requests within quota and then blocks', async () => {
    const ip = '10.0.0.1';

    const first = await call(ip);
    const second = await call(ip);
    const third = await call(ip);
    const fourth = await call(ip);

    expect(first.status).toBe(HttpStatus.OK);
    expect(second.status).toBe(HttpStatus.OK);
    expect(third.status).toBe(HttpStatus.OK);
    expect(fourth.status).toBe(HttpStatus.TOO_MANY_REQUESTS);

    const body = (await fourth.json()) as {
      error: { code: string; status: number; message: string };
    };
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(body.error.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(body.error.message).toContain('Too many requests');
  });

  test('isolates quotas per client ip', async () => {
    await call('10.0.0.2');
    await call('10.0.0.2');
    await call('10.0.0.2');

    const otherIp = await call('10.0.0.3');
    expect(otherIp.status).toBe(HttpStatus.OK);
  });
});
