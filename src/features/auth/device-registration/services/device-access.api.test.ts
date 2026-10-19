import { expect, test } from 'bun:test';
import { hasDesktopDeviceAccess } from './device-access.api';

test('desktop access succeeds when company verification is disabled', async () => {
  const result = await hasDesktopDeviceAccess('access-token', async (url, init) => {
    expect(url).toBe('/v1/auth/devices/access');
    expect(new Headers(init?.headers).get('x-vipex-client')).toBe('desktop');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer access-token');
    return Response.json({ required: false });
  });
  expect(result).toBe('allowed');
});

test('desktop access distinguishes an expired token from a denied device', async () => {
  expect(
    await hasDesktopDeviceAccess('access-token', async () => new Response(null, { status: 401 })),
  ).toBe('unauthorized');
  expect(
    await hasDesktopDeviceAccess('access-token', async () => new Response(null, { status: 403 })),
  ).toBe('denied');
});

test('desktop access treats network and server failures as temporarily unavailable', async () => {
  expect(
    await hasDesktopDeviceAccess('access-token', async () => new Response(null, { status: 503 })),
  ).toBe('unavailable');
  expect(
    await hasDesktopDeviceAccess('access-token', async () => {
      throw new Error('offline');
    }),
  ).toBe('unavailable');
});

test('a stalled desktop policy request times out into the retryable state', async () => {
  const result = await hasDesktopDeviceAccess(
    'access-token',
    async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('timed out')), {
          once: true,
        });
      }),
    5,
  );
  expect(result).toBe('unavailable');
});
