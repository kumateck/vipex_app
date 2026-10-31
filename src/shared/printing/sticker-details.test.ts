import { describe, expect, test } from 'bun:test';
import { formatStickerDateTime } from './index';

describe('sticker issue time', () => {
  test('shows Ghana date and time independently of the client timezone', () => {
    expect(formatStickerDateTime('2026-10-31T12:42:00Z')).toBe('31 Oct 2026 12:42');
    expect(formatStickerDateTime('2026-11-01T00:30:00+03:00')).toBe('31 Oct 2026 21:30');
  });
  test('does not invent a date for invalid input', () => {
    expect(formatStickerDateTime('unknown')).toBe('-');
  });
});
