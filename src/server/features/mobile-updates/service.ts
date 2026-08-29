import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { getStoredObjectResponse } from '@/server/services/storage/minio';
import { env } from '@/server/utils/env';
import { ServiceUnavailable, Unauthorized } from '@/server/utils/http-error';

const ANDROID_LATEST_PREFIX = 'mobile/android/latest';
const ANDROID_MANIFEST_KEY = `${ANDROID_LATEST_PREFIX}/latest.json`;
const ANDROID_APK_FILE_NAME = 'vipex-mobile-android.apk';
const ANDROID_APK_KEY = `${ANDROID_LATEST_PREFIX}/${ANDROID_APK_FILE_NAME}`;
const ANDROID_DOWNLOAD_PATH = '/v1/mobile-updates/android/download';
const DOWNLOAD_LINK_TTL_SECONDS = 15 * 60;

const androidUpdateManifestSchema = z.object({
  version: z.string().trim().min(1).max(40),
  versionCode: z.number().int().positive(),
  fileName: z.literal(ANDROID_APK_FILE_NAME),
  releaseNotes: z.string().trim().max(2_000).default('A new Vipex Mobile release is available.'),
  publishedAt: z.iso.datetime(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
});

type StoredObjectReader = typeof getStoredObjectResponse;
type DownloadUrlBuilder = typeof buildAndroidMobileUpdateDownloadUrl;

function signDownloadExpiry(expiresAt: number, secret: string) {
  return createHmac('sha256', secret)
    .update(`vipex-mobile-update:v1:${ANDROID_APK_KEY}:${expiresAt}`)
    .digest('hex');
}

function signaturesMatch(provided: string, expected: string) {
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
  return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
}

export function buildAndroidMobileUpdateDownloadUrl(
  nowMs = Date.now(),
  baseUrl = env.APP_BASE_URL,
  secret = env.JWT_SECRET,
) {
  const expiresAt = Math.floor(nowMs / 1000) + DOWNLOAD_LINK_TTL_SECONDS;
  const url = new URL(ANDROID_DOWNLOAD_PATH, baseUrl);
  if (url.protocol !== 'https:') {
    throw ServiceUnavailable('The public mobile update URL must use HTTPS');
  }
  url.searchParams.set('expires', String(expiresAt));
  url.searchParams.set('signature', signDownloadExpiry(expiresAt, secret));
  return url.toString();
}

export async function getAndroidMobileUpdateDownloadSvc(
  query: { expires?: string; signature?: string },
  readObject: StoredObjectReader = getStoredObjectResponse,
  nowMs = Date.now(),
  secret = env.JWT_SECRET,
) {
  const expiresAt = Number(query.expires);
  const nowSeconds = Math.floor(nowMs / 1000);
  const expectedSignature = Number.isSafeInteger(expiresAt)
    ? signDownloadExpiry(expiresAt, secret)
    : '';

  if (
    !query.signature ||
    !expectedSignature ||
    expiresAt <= nowSeconds ||
    !signaturesMatch(query.signature, expectedSignature)
  ) {
    throw Unauthorized('The mobile update download link is invalid or expired');
  }

  return readObject(ANDROID_APK_KEY, {
    cacheControl: 'private, no-store',
    contentType: 'application/vnd.android.package-archive',
  });
}

export async function getLatestAndroidMobileUpdateSvc(
  readObject: StoredObjectReader = getStoredObjectResponse,
  buildDownloadUrl: DownloadUrlBuilder = buildAndroidMobileUpdateDownloadUrl,
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
  const downloadUrl = buildDownloadUrl();

  return { ...manifest, downloadUrl };
}
