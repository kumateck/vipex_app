import { expect, test } from 'bun:test';
import { formatParcelTimestamp } from './format-parcel-timestamp';

test('formats parcel creation and receipt timestamps', () => {
  const value = new Date(2026, 0, 2, 14, 30).toISOString();
  expect(formatParcelTimestamp(value)).toBe('02 Jan 2026, 14:30');
});

test('shows a fallback for missing or invalid timestamps', () => {
  expect(formatParcelTimestamp(null)).toBe('-');
  expect(formatParcelTimestamp(undefined)).toBe('-');
  expect(formatParcelTimestamp('invalid')).toBe('-');
});
