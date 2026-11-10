import { expect, test } from 'bun:test';
import { encodeHandoverSignature } from './handover-signature';
import { isReceiverCashierSignature } from './receiver-cashier-signature';

test('Receiver Cashier requires a visible touchscreen stroke', () => {
  const check = (signatureImage: string) =>
    isReceiverCashierSignature({ source: 'touchscreen', signatureImage });
  expect(check('')).toBeFalse();
  expect(
    check(
      encodeHandoverSignature(
        [
          [
            { x: 2, y: 2 },
            { x: 2, y: 2 },
          ],
        ],
        100,
        100,
      ),
    ),
  ).toBeFalse();
  expect(
    check(
      encodeHandoverSignature(
        [
          [
            { x: 2, y: 2 },
            { x: 12, y: 12 },
          ],
        ],
        100,
        100,
      ),
    ),
  ).toBeTrue();
});

test('Topaz evidence requires both a PNG and native signature data', () => {
  const image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X6csAAAAASUVORK5CYII=';
  expect(
    isReceiverCashierSignature({ source: 'topaz', signatureImage: image, sigString: '' }),
  ).toBeFalse();
  expect(
    isReceiverCashierSignature({
      source: 'topaz',
      signatureImage: 'data:image/svg+xml,<svg/>',
      sigString: '0123456789abcdef',
    }),
  ).toBeFalse();
  expect(
    isReceiverCashierSignature({
      source: 'topaz',
      signatureImage: image,
      sigString: '0123456789abcdef',
    }),
  ).toBeTrue();
});
