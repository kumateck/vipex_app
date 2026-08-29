const HTML_NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

const IMMUTABLE_ASSET_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
} as const;

const SHORT_ASSET_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, must-revalidate',
} as const;

export function getWebCacheHeaders(pathname: string, servesSpaFallback = false) {
  if (servesSpaFallback || pathname === '/' || pathname.endsWith('.html')) {
    return HTML_NO_CACHE_HEADERS;
  }
  if (pathname.startsWith('/assets/')) return IMMUTABLE_ASSET_HEADERS;
  return SHORT_ASSET_CACHE_HEADERS;
}
