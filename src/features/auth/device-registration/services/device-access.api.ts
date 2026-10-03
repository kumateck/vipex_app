type DeviceAccessRequest = (input: string, init?: RequestInit) => Promise<Response>;

export async function hasDesktopDeviceAccess(
  accessToken: string,
  request: DeviceAccessRequest = fetch,
): Promise<boolean> {
  const response = await request('/v1/auth/devices/access', {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-vipex-client': 'desktop',
    },
  });
  if (!response.ok) return false;
  const body = (await response.json()) as { required?: unknown };
  return typeof body.required === 'boolean';
}
