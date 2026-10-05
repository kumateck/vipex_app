type DeviceAccessRequest = (input: string, init?: RequestInit) => Promise<Response>;

export type DeviceAccessResult = 'allowed' | 'unauthorized' | 'denied' | 'unavailable';

export async function hasDesktopDeviceAccess(
  accessToken: string,
  request: DeviceAccessRequest = fetch,
  timeoutMs = 10_000,
): Promise<DeviceAccessResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await request('/v1/auth/devices/access', {
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-vipex-client': 'desktop',
      },
    });
    if (response.status === 401) return 'unauthorized';
    if (response.status === 403) return 'denied';
    if (!response.ok) return 'unavailable';
    const body = (await response.json()) as { required?: unknown };
    return typeof body.required === 'boolean' ? 'allowed' : 'unavailable';
  } catch {
    return 'unavailable';
  } finally {
    clearTimeout(timeout);
  }
}
