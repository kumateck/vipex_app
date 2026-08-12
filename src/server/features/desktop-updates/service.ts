import { getStoredObjectResponse } from '@/server/services/storage/minio';
import { BadRequest } from '@/server/utils/http-error';

const WINDOWS_LATEST_PREFIX = 'desktop/windows/latest';
const MACOS_LATEST_PREFIX = 'desktop/macos/latest';
const WINDOWS_UPDATE_FILE_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9 ._()+-]{0,180}\.(?:yml|yaml|exe|nupkg|blockmap|zip)$/;
const MACOS_UPDATE_FILE_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9 ._()+-]{0,180}\.(?:yml|yaml|zip|dmg|blockmap)$/;

type StoredObjectReader = typeof getStoredObjectResponse;

export function normalizeWindowsUpdateFile(fileName: string) {
  const decoded = decodeURIComponent(fileName).trim();

  if (!decoded || decoded.includes('/') || decoded.includes('\\') || decoded.includes('..')) {
    throw BadRequest('Invalid desktop update file path');
  }

  if (decoded !== 'RELEASES' && !WINDOWS_UPDATE_FILE_PATTERN.test(decoded)) {
    throw BadRequest('Unsupported desktop update file');
  }

  return decoded;
}

export function normalizeMacosUpdateFile(fileName: string) {
  const decoded = decodeURIComponent(fileName).trim();

  if (
    !decoded ||
    decoded.includes('/') ||
    decoded.includes('\\') ||
    decoded.includes('..') ||
    !MACOS_UPDATE_FILE_PATTERN.test(decoded)
  ) {
    throw BadRequest('Unsupported desktop update file');
  }

  return decoded;
}

function getContentType(fileName: string) {
  if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) return 'text/yaml; charset=utf-8';
  if (fileName === 'RELEASES') return 'text/plain; charset=utf-8';
  if (fileName.endsWith('.blockmap')) return 'application/json';
  if (fileName.endsWith('.zip')) return 'application/zip';
  if (fileName.endsWith('.exe')) return 'application/vnd.microsoft.portable-executable';
  if (fileName.endsWith('.nupkg')) return 'application/octet-stream';
  return 'application/octet-stream';
}

export async function getWindowsDesktopUpdateResponseSvc(
  fileName: string,
  readObject: StoredObjectReader = getStoredObjectResponse,
): Promise<Response> {
  const safeFileName = normalizeWindowsUpdateFile(fileName);
  const key = `${WINDOWS_LATEST_PREFIX}/${safeFileName}`;

  return readObject(key, {
    cacheControl: 'private, no-store',
    contentType: getContentType(safeFileName),
  });
}

export async function getMacosDesktopUpdateResponseSvc(
  fileName: string,
  readObject: StoredObjectReader = getStoredObjectResponse,
): Promise<Response> {
  const safeFileName = normalizeMacosUpdateFile(fileName);
  const key = `${MACOS_LATEST_PREFIX}/${safeFileName}`;

  return readObject(key, {
    cacheControl: 'private, no-store',
    contentType: getContentType(safeFileName),
  });
}
