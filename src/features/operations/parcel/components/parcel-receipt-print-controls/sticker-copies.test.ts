import { describe, expect, test } from 'bun:test';
import { normalizeStickerCopies } from './sticker-copies';

describe('normalizeStickerCopies', () => {
  test('accepts any positive whole number without an application maximum', () => {
    expect(normalizeStickerCopies(1)).toBe(1);
    expect(normalizeStickerCopies(250)).toBe(250);
  });

  test('normalizes invalid, fractional, and non-positive values', () => {
    expect(normalizeStickerCopies(Number.NaN)).toBe(1);
    expect(normalizeStickerCopies(3.9)).toBe(3);
    expect(normalizeStickerCopies(0)).toBe(1);
    expect(normalizeStickerCopies(-5)).toBe(1);
  });
});
