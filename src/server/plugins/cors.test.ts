import { expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { corsPlugin } from './cors';

test('native device headers are permitted in cross-origin preflight', async () => {
  const app = new Elysia().use(corsPlugin).get('/v1/auth/devices/status', () => 'ok');
  const response = await app.handle(
    new Request('https://api.example.test/v1/auth/devices/status', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://app.example.test',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'x-vipex-client,x-vipex-device-id,x-vipex-device-secret',
      },
    }),
  );
  const allowed = response.headers.get('access-control-allow-headers')?.toLowerCase() ?? '';
  expect(response.status).toBe(204);
  expect(allowed).toContain('x-vipex-client');
  expect(allowed).toContain('x-vipex-device-id');
  expect(allowed).toContain('x-vipex-device-secret');
});
