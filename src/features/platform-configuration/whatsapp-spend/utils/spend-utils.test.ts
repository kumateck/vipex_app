import { describe, expect, test } from 'bun:test';
import type { WhatsAppSpendReport } from '../types';
import { buildSpendCsvRows } from './spend-csv';
import { presetRange, rangeToParams } from './spend-period';

const counts = {
  messages: 2,
  delivered: 2,
  failed: 0,
  billable: 2,
  estimated: 0,
  free: 0,
  unconfirmed: 0,
};

describe('spend period', () => {
  test('last month covers the full previous calendar month', () => {
    const range = presetRange('last-month', new Date(2026, 10, 8));
    expect(rangeToParams(range)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });

  test('an incomplete range has no params', () => {
    expect(rangeToParams({ from: new Date(2026, 10, 1), to: undefined })).toBeNull();
  });
});

describe('buildSpendCsvRows', () => {
  test('lists message types, days and a total row', () => {
    const report = {
      period: { from: '2026-11-01', to: '2026-11-30' },
      totals: { ...counts, amount: 0.04 },
      byEvent: [
        {
          ...counts,
          eventCode: 'x',
          name: 'Booking receipt',
          category: 'utility',
          rate: 0.02,
          rateVaries: false,
          amount: 0.04,
        },
      ],
      daily: [{ ...counts, day: '2026-11-08', amount: 0.04 }],
    } as unknown as WhatsAppSpendReport;
    const rows = buildSpendCsvRows(report);
    expect(rows[0]).toEqual(['Message type', 'Booking receipt', 2, 2, 0, 2, 0, '0.0200', '0.04']);
    expect(rows.at(-1)?.[0]).toBe('Total');
    expect(rows.at(-1)?.at(-1)).toBe('0.04');
  });
});
