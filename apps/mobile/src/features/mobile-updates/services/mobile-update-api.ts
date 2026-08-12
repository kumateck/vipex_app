import { getApiDebugInfo } from '@mobile/lib/api';
import type { AndroidMobileUpdate } from '../types/mobile-update';

export async function fetchLatestAndroidUpdate(accessToken: string): Promise<AndroidMobileUpdate> {
  const response = await fetch(
    `${getApiDebugInfo().activeApiBaseUrl}/mobile-updates/android/latest`,
    {
      headers: { authorization: `Bearer ${accessToken}` },
    },
  );
  const body = (await response.json().catch(() => null)) as
    | AndroidMobileUpdate
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    const message = body && 'error' in body ? body.error?.message : null;
    throw new Error(`${message || 'Unable to check for mobile updates'} (${response.status})`);
  }

  return body as AndroidMobileUpdate;
}
