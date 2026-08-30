import { describe, expect, test } from 'bun:test';
import { normalizeConsignmentHistoryRange } from '@/server/features/shipments/consignment-history.service';

describe('consignment history date range', () => {
  test('accepts a single date as an inclusive range', () => {
    const range = normalizeConsignmentHistoryRange('2026-08-20', '2026-08-20');

    expect(range.dateFrom.toISOString()).toBe('2026-08-20T00:00:00.000Z');
    expect(range.dateTo.toISOString()).toBe('2026-08-20T23:59:59.999Z');
  });

  test('accepts an earlier start date and later end date', () => {
    const range = normalizeConsignmentHistoryRange('2026-08-01', '2026-08-20');

    expect(range.dateFrom.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(range.dateTo.toISOString()).toBe('2026-08-20T23:59:59.999Z');
  });

  test('rejects reversed and invalid dates', () => {
    expect(() => normalizeConsignmentHistoryRange('2026-08-21', '2026-08-20')).toThrow(
      'End date must be on or after start date',
    );
    expect(() => normalizeConsignmentHistoryRange('2026-02-30', '2026-03-01')).toThrow(
      'Invalid consignment date',
    );
    expect(() => normalizeConsignmentHistoryRange('20/08/2026', '2026-08-20')).toThrow(
      'Dates must use YYYY-MM-DD format',
    );
  });
});
