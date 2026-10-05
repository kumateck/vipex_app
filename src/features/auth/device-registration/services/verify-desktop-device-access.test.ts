import { expect, test } from 'bun:test';
import type { AuthUser } from '@/stores/auth-store';
import { verifyDesktopDeviceAccess } from './verify-desktop-device-access';

const staff = { id: 'staff-1' } as AuthUser;

test('an expired access token refreshes once and retries desktop verification', async () => {
  const checked: string[] = [];
  const result = await verifyDesktopDeviceAccess(
    'old-token',
    async (token) => {
      checked.push(token);
      return token === 'old-token' ? 'unauthorized' : 'allowed';
    },
    async () => ({
      status: 'refreshed',
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      user: staff,
    }),
  );
  expect(result).toBe('allowed');
  expect(checked).toEqual(['old-token', 'new-token']);
});

test('temporary refresh failure blocks access without treating it as revocation', async () => {
  expect(
    await verifyDesktopDeviceAccess(
      'expired-token',
      async () => 'unauthorized',
      async () => ({ status: 'unavailable' }),
    ),
  ).toBe('unavailable');
});

test('invalid refresh or repeated unauthorized access denies the session', async () => {
  expect(
    await verifyDesktopDeviceAccess(
      'expired-token',
      async () => 'unauthorized',
      async () => ({ status: 'invalid' }),
    ),
  ).toBe('denied');
  expect(
    await verifyDesktopDeviceAccess(
      'expired-token',
      async () => 'unauthorized',
      async () => ({
        status: 'refreshed',
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        user: staff,
      }),
    ),
  ).toBe('denied');
});
