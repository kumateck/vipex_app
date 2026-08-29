import { describe, expect, test } from 'bun:test';
import { getWebCacheHeaders } from './web-cache';

describe('getWebCacheHeaders', () => {
  test('prevents HTML and SPA fallbacks from retaining an old build graph', () => {
    expect(getWebCacheHeaders('/')['Cache-Control']).toContain('no-store');
    expect(getWebCacheHeaders('/parcels/incoming', true)['Cache-Control']).toContain('no-cache');
  });

  test('caches content-hashed build assets immutably', () => {
    expect(getWebCacheHeaders('/assets/page-BV2PLpXl.js')).toEqual({
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  });
});
