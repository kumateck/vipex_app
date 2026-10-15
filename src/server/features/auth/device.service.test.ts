import { describe, expect, test } from 'bun:test';
import { canReviewDevice, deviceAccessFailure } from './device.service';
import { readDeviceCredential, readNativeClient } from './device-headers';

describe('registered-device authorization rules', () => {
  test('binds an approved device to the right account and native client kind', () => {
    const device = { userId: 'user-1', kind: 'mobile', status: 'approved', userStatus: 0 };
    expect(deviceAccessFailure(device, 'user-1', 'mobile')).toBeNull();
    expect(deviceAccessFailure(device, 'user-2', 'mobile')).toContain('does not match');
    expect(deviceAccessFailure(device, 'user-1', 'desktop')).toContain('does not match');
    expect(deviceAccessFailure({ ...device, status: 'blocked' }, 'user-1', 'mobile')).toContain(
      'blocked',
    );
    expect(deviceAccessFailure({ ...device, userStatus: 3 }, 'user-1', 'mobile')).toContain(
      'Account unavailable',
    );
  });
  test('new registrations require approval and an approved device can be revoked', () => {
    expect(canReviewDevice('pending', 'approve')).toEqual({ next: 'approved', allowed: true });
    expect(canReviewDevice('approved', 'revoke')).toEqual({ next: 'revoked', allowed: true });
    expect(canReviewDevice('revoked', 'approve')).toEqual({ next: 'approved', allowed: true });
  });

  test('unblocking returns to pending, and permanent denial cannot be reversed', () => {
    expect(canReviewDevice('blocked', 'unblock')).toEqual({ next: 'pending', allowed: true });
    expect(canReviewDevice('blocked', 'approve').allowed).toBe(false);
    expect(canReviewDevice('permanently_denied', 'approve').allowed).toBe(false);
    expect(canReviewDevice('permanently_denied', 'unblock').allowed).toBe(false);
  });

  test('device credential is only present when both parts are supplied', () => {
    const valid = new Request('https://example.test/v1/auth/login', {
      headers: {
        'x-vipex-client': 'mobile',
        'x-vipex-device-id': 'device-1',
        'x-vipex-device-secret': 'secret',
      },
    });
    expect(readNativeClient(valid)).toBe('mobile');
    expect(readDeviceCredential(valid)).toEqual({ id: 'device-1', secret: 'secret' });
    const incomplete = new Request('https://example.test/v1/auth/login', {
      headers: { 'x-vipex-client': 'desktop', 'x-vipex-device-id': 'device-1' },
    });
    expect(readNativeClient(incomplete)).toBe('desktop');
    expect(readDeviceCredential(incomplete)).toBeNull();
    expect(() =>
      readNativeClient(
        new Request('https://example.test/v1/auth/login', {
          headers: { 'x-vipex-client': 'unrecognized' },
        }),
      ),
    ).toThrow('Unsupported client type');
  });
});
