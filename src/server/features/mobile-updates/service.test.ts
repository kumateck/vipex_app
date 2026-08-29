import { describe, expect, test } from 'bun:test';
import {
  buildAndroidMobileUpdateDownloadUrl,
  getAndroidMobileUpdateDownloadSvc,
  getLatestAndroidMobileUpdateSvc,
} from './service';

const manifest = {
  version: '1.0.42',
  versionCode: 42,
  fileName: 'vipex-mobile-android.apk' as const,
  releaseNotes: 'Scanner improvements',
  publishedAt: '2026-08-12T10:00:00.000Z',
  sha256: 'a'.repeat(64),
};

describe('getLatestAndroidMobileUpdateSvc', () => {
  test('returns validated metadata with a short-lived HTTPS API download URL', async () => {
    const readObject = async () => Response.json(manifest);
    const buildDownloadUrl = () => 'https://app.example/v1/mobile-updates/android/download';

    const result = await getLatestAndroidMobileUpdateSvc(readObject, buildDownloadUrl);

    expect(result).toEqual({
      ...manifest,
      downloadUrl: 'https://app.example/v1/mobile-updates/android/download',
    });
  });

  test('rejects malformed release metadata', async () => {
    const readObject = async () => Response.json({ ...manifest, versionCode: 0 });

    expect(getLatestAndroidMobileUpdateSvc(readObject)).rejects.toMatchObject({ status: 503 });
  });
});

describe('Android mobile update download links', () => {
  const nowMs = Date.UTC(2026, 7, 27, 12, 0, 0);
  const secret = 'test-mobile-update-secret-at-least-32-characters';

  test('builds an HTTPS link on the public app origin', () => {
    const result = new URL(
      buildAndroidMobileUpdateDownloadUrl(nowMs, 'https://app.vipexparcels.com', secret),
    );

    expect(result.origin).toBe('https://app.vipexparcels.com');
    expect(result.pathname).toBe('/v1/mobile-updates/android/download');
    expect(result.searchParams.get('expires')).toBe(String(nowMs / 1000 + 15 * 60));
    expect(result.searchParams.get('signature')).toMatch(/^[a-f0-9]{64}$/);
  });

  test('refuses to advertise an insecure public app URL', () => {
    expect(() => buildAndroidMobileUpdateDownloadUrl(nowMs, 'http://app.example', secret)).toThrow(
      'The public mobile update URL must use HTTPS',
    );
  });

  test('streams the fixed APK for a valid signed link', async () => {
    const url = new URL(buildAndroidMobileUpdateDownloadUrl(nowMs, 'https://app.example', secret));
    const readObject = async (key: string, options?: { contentType?: string }) =>
      new Response(key, { headers: { 'content-type': options?.contentType ?? '' } });

    const response = await getAndroidMobileUpdateDownloadSvc(
      {
        expires: url.searchParams.get('expires') ?? undefined,
        signature: url.searchParams.get('signature') ?? undefined,
      },
      readObject,
      nowMs,
      secret,
    );

    expect(await response.text()).toBe('mobile/android/latest/vipex-mobile-android.apk');
    expect(response.headers.get('content-type')).toBe('application/vnd.android.package-archive');
  });

  test('rejects expired or altered download links', async () => {
    const url = new URL(buildAndroidMobileUpdateDownloadUrl(nowMs, 'https://app.example', secret));
    const query = {
      expires: url.searchParams.get('expires') ?? undefined,
      signature: url.searchParams.get('signature') ?? undefined,
    };

    expect(
      getAndroidMobileUpdateDownloadSvc(
        query,
        async () => new Response(),
        nowMs + 16 * 60_000,
        secret,
      ),
    ).rejects.toMatchObject({ status: 401 });
    expect(
      getAndroidMobileUpdateDownloadSvc(
        { ...query, signature: 'a'.repeat(64) },
        async () => new Response(),
        nowMs,
        secret,
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
});
