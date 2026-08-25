import { describe, expect, test } from 'bun:test';
import { buildParcelTrackingUrl } from './tracking-url';

describe('buildParcelTrackingUrl', () => {
  test('builds the URL encoded on parcel sticker QR codes', () => {
    expect(buildParcelTrackingUrl('VIP/ACC 123')).toBe(
      'https://vipexparcel.com/tracking/VIP%2FACC%20123',
    );
  });
});
