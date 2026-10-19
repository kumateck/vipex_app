import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThermalStickerTemplate } from './thermal-sticker-template';

const baseProps = {
  bookingCode: 'BOOKING-CODE-MUST-NOT-PRINT',
  issuedAtLabel: '22 Sep 2026',
  parcelDetails: '1 parcel',
  parcelContent: 'Clothes',
  senderName: 'Sender',
  senderTelephone: '0200000000',
  receiverName: 'Receiver',
  receiverTelephone: '0500000000',
  destinationBranchName: 'Circle',
  destinationLocationName: 'Accra',
  qrValue: 'QR-TRACKING-CODE',
  formatMoney: (amount: number) => `GHS ${amount.toFixed(2)}`,
};

describe('ThermalStickerTemplate', () => {
  test.each(['portrait', 'landscape'] as const)(
    'keeps unpaid completion %s labels pending',
    (orientation) => {
      const pending = renderToStaticMarkup(
        <ThermalStickerTemplate
          {...baseProps}
          orientation={orientation}
          paymentStatusLabel="PENDING"
        />,
      );
      const credit = renderToStaticMarkup(
        <ThermalStickerTemplate
          {...baseProps}
          orientation={orientation}
          paymentStatusLabel="CREDIT"
        />,
      );
      const receiver = renderToStaticMarkup(
        <ThermalStickerTemplate
          {...baseProps}
          orientation={orientation}
          paymentStatusLabel="PENDING"
          toBePaidCedis={30}
        />,
      );
      expect(pending).toContain('PENDING');
      expect(pending).not.toContain('>PAID<');
      expect(credit).toContain('CREDIT');
      expect(receiver).toContain('TO BE PAID');
      expect(receiver).toContain('GHS 30.00');
    },
  );
  test.each(['portrait', 'landscape'] as const)(
    'marks all reprinted %s stickers as duplicate',
    (orientation) => {
      const original = renderToStaticMarkup(
        <ThermalStickerTemplate {...baseProps} orientation={orientation} />,
      );
      const duplicate = renderToStaticMarkup(
        <ThermalStickerTemplate {...baseProps} orientation={orientation} duplicate />,
      );
      expect(original).not.toContain('DUPLICATE');
      expect(duplicate).toContain('DUPLICATE');
      expect(duplicate).toContain('Parcel tracking QR code');
      // Printed in the header under the wordmark, not inside the status/payment box.
      const brandStart = duplicate.indexOf('data-sticker-brand');
      expect(brandStart).toBeGreaterThanOrEqual(0);
      expect(duplicate.indexOf('DUPLICATE')).toBeGreaterThan(brandStart);
      expect(duplicate.match(/DUPLICATE/g)).toHaveLength(1);
    },
  );

  test.each(['portrait', 'landscape'] as const)(
    'does not print a human-readable code beneath the %s QR',
    (orientation) => {
      const markup = renderToStaticMarkup(
        <ThermalStickerTemplate {...baseProps} orientation={orientation} />,
      );

      expect(markup).toContain('Parcel tracking QR code');
      expect(markup).not.toContain('<canvas');
      expect(markup).toMatch(/<path d="M[^"]+" fill="#000"/);
      expect(markup).toMatch(
        /<img[^>]*src="data:image\/png;base64,[^"]+"[^>]*alt="Vipex (?:logo|emblem)"/,
      );
      expect(markup).not.toContain(baseProps.bookingCode);
    },
  );

  test.each(['portrait', 'landscape'] as const)(
    'shows CS beside receiver details on a flagged %s sticker only',
    (orientation) => {
      const marked = renderToStaticMarkup(
        <ThermalStickerTemplate {...baseProps} callSender orientation={orientation} />,
      );
      const unmarked = renderToStaticMarkup(
        <ThermalStickerTemplate {...baseProps} orientation={orientation} />,
      );

      expect(marked).toContain('>CS</span>');
      expect(marked).toContain('Receiver');
      expect(marked).toContain('0500000000');
      expect(unmarked).not.toContain('>CS</span>');
    },
  );
});
