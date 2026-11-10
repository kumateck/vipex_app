import { expect, test } from 'bun:test';
import {
  encodeHandoverSignature,
  isHandoverSignature,
  MAX_HANDOVER_SIGNATURE_LENGTH,
} from './handover-signature';

const signed = encodeHandoverSignature(
  [
    [
      { x: 3, y: 4 },
      { x: 45, y: 12.5 },
    ],
    [
      { x: 6, y: -0.2 },
      { x: 85, y: 80 },
    ],
  ],
  360.5,
  240,
);

test('accepts the rider pad format with multiple drawn strokes', () => {
  expect(isHandoverSignature(signed)).toBe(true);
});

test('rejects blank, malformed, oversized and non-pad SVG input', () => {
  expect(isHandoverSignature(encodeHandoverSignature([[{ x: 3, y: 4 }]], 300, 240))).toBe(false);
  expect(isHandoverSignature('data:image/svg+xml;utf8,%')).toBe(false);
  expect(isHandoverSignature(signed + 'x'.repeat(MAX_HANDOVER_SIGNATURE_LENGTH))).toBe(false);
  expect(isHandoverSignature(signed.replace('%3Cpath', '%3Cg%3E%3Cpath'))).toBe(false);
});
