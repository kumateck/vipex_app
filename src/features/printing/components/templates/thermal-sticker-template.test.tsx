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
    'does not print a human-readable code beneath the %s QR',
    (orientation) => {
      const markup = renderToStaticMarkup(
        <ThermalStickerTemplate {...baseProps} orientation={orientation} />,
      );

      expect(markup).toContain('Parcel tracking QR code');
      expect(markup).not.toContain(baseProps.bookingCode);
    },
  );
});
