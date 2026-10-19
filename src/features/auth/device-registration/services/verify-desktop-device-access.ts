import { refreshAuthSession, type SessionRefreshResult } from '@/features/auth/session';
import { hasDesktopDeviceAccess, type DeviceAccessResult } from './device-access.api';

export type DesktopVerificationResult = 'allowed' | 'denied' | 'unavailable' | 'superseded';

export async function verifyDesktopDeviceAccess(
  accessToken: string,
  check: (token: string) => Promise<DeviceAccessResult> = hasDesktopDeviceAccess,
  refresh: () => Promise<SessionRefreshResult> = refreshAuthSession,
): Promise<DesktopVerificationResult> {
  const first = await check(accessToken);
  if (first !== 'unauthorized') return first;

  const renewed = await refresh();
  if (renewed.status === 'invalid') return 'denied';
  if (renewed.status === 'unavailable') return 'unavailable';
  if (renewed.status === 'superseded') return 'superseded';

  const second = await check(renewed.accessToken);
  return second === 'unauthorized' ? 'denied' : second;
}
