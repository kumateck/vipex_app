import { expect, test } from 'bun:test';
import { hasDesktopDeviceAccess } from './device-access.api';

test('desktop access succeeds when company verification is disabled', async () => {
  const allowed = await hasDesktopDeviceAccess('access-token', async (url, init) => {
    expect(url).toBe('/v1/auth/devices/access');
    expect(new Headers(init?.headers).get('x-vipex-client')).toBe('desktop');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer access-token');
    return Response.json({ required: false });
  });
  expect(allowed).toBe(true);
});

test('desktop access fails closed when the server rejects the session', async () => {
  expect(
    await hasDesktopDeviceAccess('access-token', async () => new Response(null, { status: 401 })),
  ).toBe(false);
});
