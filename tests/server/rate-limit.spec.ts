import { describe, expect, spyOn, test } from 'bun:test';
import { Elysia } from 'elysia';
import { createRateLimitPlugin } from '../../src/server/middlewares/rate-limit';
import { MemoryCacheStore } from '../../src/server/services/cache/memory-cache';
import { HttpStatus } from '../../src/server/utils/http-status';
import { signAccessToken } from '../../src/server/utils/jwt';

const app = new Elysia()
  .use(
    createRateLimitPlugin({
      windowSeconds: 60,
      maxRequests: 3,
      staffReadMultiplier: 4,
      cache: new MemoryCacheStore(),
    }),
  )
  .get('/limited', () => ({ ok: true }))
  .get('/v1/shipments/parcels', () => ({ ok: true }))
  .post('/v1/shipments/parcels', () => ({ ok: true }))
  .get('/v1/public/tracking/example', () => ({ ok: true }))
  .get('/v1/auth/login', () => ({ ok: true }))
  .get('/v1/auth/me/profile', () => ({ ok: true }))
  .get('/v1/self-service/branch', () => ({ ok: true }))
  .get('/v1/desktop-updates/current', () => ({ ok: true }));

async function call(
  ip: string,
  token?: string,
  path = '/limited',
  method: 'GET' | 'POST' | 'OPTIONS' = 'GET',
): Promise<Response> {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'x-forwarded-for': ip,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
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

  test('isolates authenticated users sharing one public ip', async () => {
    const sharedIp = '10.0.0.4';
    const tokenA = await signAccessToken({ sub: 'user-a' });
    const tokenB = await signAccessToken({ sub: 'user-b' });
    await call(sharedIp, tokenA);
    await call(sharedIp, tokenA);
    await call(sharedIp, tokenA);

    expect((await call(sharedIp, tokenA)).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((await call(sharedIp, tokenB)).status).toBe(HttpStatus.OK);
  });

  test('allows a previously limited client after the original window ends', async () => {
    const clock = spyOn(Date, 'now');
    const ip = '10.0.0.5';
    try {
      clock.mockReturnValue(1_000);
      expect((await call(ip)).status).toBe(HttpStatus.OK);
      clock.mockReturnValue(59_000);
      await call(ip);
      await call(ip);
      expect((await call(ip)).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      clock.mockReturnValue(61_000);
      expect((await call(ip)).status).toBe(HttpStatus.OK);
    } finally {
      clock.mockRestore();
    }
  });

  test('gives staff reads more room without raising public or write quotas', async () => {
    const ip = '10.0.0.6';
    const token = await signAccessToken({ sub: 'staff-read-user' });
    const staffPath = '/v1/shipments/parcels';
    for (let index = 0; index < 12; index += 1) {
      const response = await call(ip, token, staffPath);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.headers.get('x-ratelimit-limit')).toBe('12');
      expect(response.headers.get('x-ratelimit-policy')).toBe('staff-read');
    }
    const limited = await call(ip, token, staffPath);
    expect(limited.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(limited.headers.get('retry-after')).toBe('60');
    expect((await call(ip, token, '/v1/auth/me/profile')).headers.get('x-ratelimit-limit')).toBe(
      '12',
    );

    for (let index = 0; index < 3; index += 1) {
      expect((await call(ip, token, staffPath, 'POST')).status).toBe(HttpStatus.OK);
      expect((await call(ip, token, '/v1/public/tracking/example')).status).toBe(HttpStatus.OK);
      expect((await call(ip, token, '/v1/auth/login')).status).toBe(HttpStatus.OK);
      expect((await call(ip, token, '/v1/self-service/branch')).status).toBe(HttpStatus.OK);
      expect((await call(ip, token, '/v1/desktop-updates/current')).status).toBe(HttpStatus.OK);
    }
    expect((await call(ip, token, staffPath, 'POST')).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((await call(ip, token, '/v1/public/tracking/example')).status).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect((await call(ip, token, '/v1/auth/login')).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((await call(ip, token, '/v1/self-service/branch')).status).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect((await call(ip, token, '/v1/desktop-updates/current')).status).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
  });

  test('keeps anonymous requests to a staff route at the standard quota', async () => {
    const ip = '10.0.0.8';
    const path = '/v1/shipments/parcels';
    for (let index = 0; index < 3; index += 1) {
      const response = await call(ip, undefined, path);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.headers.get('x-ratelimit-limit')).toBe('3');
    }
    expect((await call(ip, undefined, path)).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  test('does not give an unsigned bearer header the staff allowance', async () => {
    const ip = '10.0.0.9';
    const path = '/v1/shipments/parcels';
    for (let index = 0; index < 3; index += 1) {
      const response = await call(ip, 'not-a-signed-token', path);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.headers.get('x-ratelimit-limit')).toBe('3');
    }
    expect((await call(ip, 'not-a-signed-token', path)).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((await call(ip, 'another-unsigned-token', path)).status).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
  });

  test('does not count preflight requests against the staff quota', async () => {
    const ip = '10.0.0.7';
    const path = '/v1/shipments/parcels';
    const token = await signAccessToken({ sub: 'preflight-user' });
    const preflight = await call(ip, token, path, 'OPTIONS');
    expect(preflight.headers.get('x-ratelimit-limit')).toBeNull();
    const first = await call(ip, token, path);
    expect(first.headers.get('x-ratelimit-remaining')).toBe('11');
  });
});
