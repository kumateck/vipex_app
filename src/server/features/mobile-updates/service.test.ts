import { describe, expect, test } from 'bun:test';
import { getLatestAndroidMobileUpdateSvc } from './service';

const manifest = {
  version: '1.0.42',
  versionCode: 42,
  fileName: 'vipex-mobile-android.apk' as const,
  releaseNotes: 'Scanner improvements',
  publishedAt: '2026-08-12T10:00:00.000Z',
  sha256: 'a'.repeat(64),
};

describe('getLatestAndroidMobileUpdateSvc', () => {
  test('returns validated metadata with a short-lived signed APK URL', async () => {
    const readObject = async () => Response.json(manifest);
    const signObject = async () => 'https://storage.example/signed.apk';

    const result = await getLatestAndroidMobileUpdateSvc(readObject, signObject);

    expect(result).toEqual({ ...manifest, downloadUrl: 'https://storage.example/signed.apk' });
  });

  test('rejects malformed release metadata', async () => {
    const readObject = async () => Response.json({ ...manifest, versionCode: 0 });

    expect(getLatestAndroidMobileUpdateSvc(readObject)).rejects.toMatchObject({ status: 503 });
  });
});
