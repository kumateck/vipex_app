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
  paymentStatusLabel: 'TO BE PAID',
  copies: 2,
};

describe('mobile to-be-paid sticker', () => {
  test('prints complaint and issuer details on every copy with escaped staff names', () => {
    const html = buildMobileStickerHtml({
      ...sticker,
      printedByName: '<Cashier & Co>',
      issuedAtLabel: '31 Oct 2026 12:42',
    });
    expect(html.match(/Complaints: \+233 27 501 9133/g)).toHaveLength(2);
    expect(html.match(/Cashier: &lt;Cashier &amp; Co&gt;/g)).toHaveLength(2);
    expect(html.match(/Date: 31 Oct 2026 12:42/g)).toHaveLength(2);
    expect(html).not.toContain('<Cashier & Co>');
  });
  test.each(['PENDING', 'UNPAID', 'unknown', undefined])(
    'rejects unverified state %s before producing any HTML',
    (status) => {
      expect(() =>
        buildMobileStickerHtml({
          ...sticker,
          amountCedis: 0,
          paymentStatusLabel: status as MobileSticker['paymentStatusLabel'],
        }),
      ).toThrow('requires a verified');
    },
  );
  test.each(['PAID', 'CREDIT'] as const)(
    'prints explicit %s without a receiver payment note',
    (status) => {
      const html = buildMobileStickerHtml({
        ...sticker,
        amountCedis: 0,
        paymentStatusLabel: status,
      });
      expect(html).toContain(`>${status}<`);
      expect(html).not.toContain('GHS 0.00');
      expect(html).not.toContain('PAYMENT DUE UPON RECEIPT');
    },
  );
  test('rejects inconsistent known statuses and amounts', () => {
    expect(() => buildMobileStickerHtml({ ...sticker, paymentStatusLabel: 'CREDIT' })).toThrow(
      'do not match',
    );
    expect(() => buildMobileStickerHtml({ ...sticker, amountCedis: 0 })).toThrow('do not match');
  });
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

  test('sizes the receiver name so the receiver phone is never pushed out of the block', () => {
    const short = buildMobileStickerHtml({ ...sticker, receiverName: 'ADU EVANS', copies: 1 });
    const long = buildMobileStickerHtml({
      ...sticker,
      receiverName: 'JOSEMARIAM ABENA APPIAH',
      copies: 1,
    });
    expect(short).toContain('class="receiver-name" style="font-size:5mm"');
    expect(long).toContain('class="receiver-name" style="font-size:3.8mm"');
    expect(long).toContain('0550000000');
    expect(long).not.toContain('grid-template-rows:25mm 12.5mm 18mm');
  });

  test.each([0, -1, 1.5, Number.POSITIVE_INFINITY])('rejects invalid copy count', (copies) => {
    expect(() => buildMobileStickerHtml({ ...sticker, copies })).toThrow();
  });

  test('marks CS on each copy without hiding receiver details', () => {
    const html = buildMobileStickerHtml({ ...sticker, callSender: true });
    expect(html.match(/<span class="cs">CS<\/span>/g)).toHaveLength(2);
    expect(html).toContain('&lt;Ben&gt;');
    expect(html).toContain('0550000000');
    expect(buildMobileStickerHtml(sticker)).not.toContain('<span class="cs">CS</span>');
  });
});
