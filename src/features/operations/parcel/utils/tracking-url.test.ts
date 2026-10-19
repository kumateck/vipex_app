import { describe, expect, test } from 'bun:test';
import { buildParcelStickerQrValue, buildParcelTrackingUrl } from './tracking-url';

describe('buildParcelTrackingUrl', () => {
  test('builds the public parcel tracking URL', () => {
    expect(buildParcelTrackingUrl('VIP/ACC 123')).toBe(
      'https://vipexparcel.com/tracking/VIP%2FACC%20123',
    );
  });

  test('builds a compact sticker payload for reliable thermal printing', () => {
    expect(buildParcelStickerQrValue(' VIP/ACC 123 ')).toBe('QR-VIP/ACC 123');
  });
});
