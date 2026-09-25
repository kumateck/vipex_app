import { describe, expect, test } from 'bun:test';
import { buildMobileStickerHtml, type MobileSticker } from './sticker-html';

const sticker: MobileSticker = {
  bookingCode: 'AA123',
  trackingCode: 'TRK123',
  senderName: 'Ada & Co',
  senderPhone: '0240000000',
  receiverName: '<Ben>',
  receiverPhone: '0550000000',
  destinationBranch: 'Kumasi',
  destinationLocation: 'Asafo',
  parcelDetails: '1 box',
  amountCedis: 40,
  copies: 2,
};

describe('mobile to-be-paid sticker', () => {
  test('prints each requested copy with a scannable QR and escaped customer data', () => {
    const html = buildMobileStickerHtml(sticker);
    expect(html.match(/class="sticker"/g)).toHaveLength(2);
    expect(html).toContain('PLEASE NOTE: PAYMENT DUE UPON RECEIPT OF PARCEL.');
    expect(html).toContain('class="receiver"');
    expect(html).toContain('class="destination"');
    expect(html).toContain('TO BE PAID');
    expect(html).toContain('GHS 40.00');
    expect(html).toContain('Ada &amp; Co');
    expect(html).toContain('&lt;Ben&gt;');
    expect(html).not.toContain('<Ben>');
    expect(html).toContain('class="qr"');
  });

  test.each([0, -1, 1.5, Number.POSITIVE_INFINITY])('rejects invalid copy count', (copies) => {
    expect(() => buildMobileStickerHtml({ ...sticker, copies })).toThrow();
  });
});
