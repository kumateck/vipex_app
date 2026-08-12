import { z } from 'zod';
import {
  getStoredObjectPresignedUrl,
  getStoredObjectResponse,
} from '@/server/services/storage/minio';
import { ServiceUnavailable } from '@/server/utils/http-error';

const ANDROID_LATEST_PREFIX = 'mobile/android/latest';
const ANDROID_MANIFEST_KEY = `${ANDROID_LATEST_PREFIX}/latest.json`;

const androidUpdateManifestSchema = z.object({
  version: z.string().trim().min(1).max(40),
  versionCode: z.number().int().positive(),
  fileName: z.literal('vipex-mobile-android.apk'),
  releaseNotes: z.string().trim().max(2_000).default('A new Vipex Mobile release is available.'),
  publishedAt: z.iso.datetime(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
});

type StoredObjectReader = typeof getStoredObjectResponse;
type StoredObjectSigner = typeof getStoredObjectPresignedUrl;

export async function getLatestAndroidMobileUpdateSvc(
  readObject: StoredObjectReader = getStoredObjectResponse,
  signObject: StoredObjectSigner = getStoredObjectPresignedUrl,
) {
  const response = await readObject(ANDROID_MANIFEST_KEY, {
    cacheControl: 'private, no-store',
    contentType: 'application/json; charset=utf-8',
  });
  const parsed = androidUpdateManifestSchema.safeParse(await response.json().catch(() => null));

  if (!parsed.success) {
    throw ServiceUnavailable('The Android mobile update manifest is invalid');
  }

  const manifest = parsed.data;
  const downloadUrl = await signObject(`${ANDROID_LATEST_PREFIX}/${manifest.fileName}`, {
    expiresInSeconds: 15 * 60,
    contentType: 'application/vnd.android.package-archive',
  });

  return { ...manifest, downloadUrl };
}
