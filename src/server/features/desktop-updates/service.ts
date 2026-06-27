import { getStoredObjectResponse } from '@/server/services/storage/minio';
import { BadRequest } from '@/server/utils/http-error';

const WINDOWS_LATEST_PREFIX = 'desktop/windows/latest';
const WINDOWS_UPDATE_FILE_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9 ._()+-]{0,180}\.(?:yml|yaml|exe|nupkg|blockmap|zip)$/;

function normalizeWindowsUpdateFile(fileName: string) {
  const decoded = decodeURIComponent(fileName).trim();

  if (!decoded || decoded.includes('/') || decoded.includes('\\') || decoded.includes('..')) {
    throw BadRequest('Invalid desktop update file path');
  }

  if (decoded !== 'RELEASES' && !WINDOWS_UPDATE_FILE_PATTERN.test(decoded)) {
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

function getCacheControl(fileName: string) {
  if (fileName === 'latest.yml' || fileName === 'RELEASES') {
    return 'private, no-cache, no-store, must-revalidate';
  }

  return 'private, max-age=31536000, immutable';
}

export function getWindowsDesktopUpdateObjectSvc(fileName: string) {
  const safeFileName = normalizeWindowsUpdateFile(fileName);

  return getStoredObjectResponse(`${WINDOWS_LATEST_PREFIX}/${safeFileName}`, {
    cacheControl: getCacheControl(safeFileName),
    contentType: getContentType(safeFileName),
  });
}
