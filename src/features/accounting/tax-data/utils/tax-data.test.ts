import { describe, expect, test } from 'bun:test';
import type { TaxDataRow } from '../types';
import {
  parseTaxDataAmount,
  parseTaxDataOccurrences,
  mergeTaxDataSelection,
  sumTaxDataRows,
} from './tax-data';
const row = (parcelId: string, paidPrincipalPsw = 12000) =>
  ({
    parcelId,
    version: parcelId,
    paidPrincipalPsw,
    netPsw: 10000,
    vatPsw: 1500,
    getfundPsw: 250,
    nhilPsw: 250,
    covidPsw: 0,
    otherTaxPsw: 0,
    taxTotalPsw: 2000,
  }) as TaxDataRow;
describe('tax data export list', () => {
  test('accepts only a whole occurrence cap from 1 to 500', () => {
    expect(parseTaxDataOccurrences('1')).toBe(1);
    expect(parseTaxDataOccurrences(' 500 ')).toBe(500);
    for (const value of ['', '0', '-1', '1.5', '501', '1e2', 'abc'])
      expect(parseTaxDataOccurrences(value)).toBeNull();
  });
  test('parses exact positive money with no accidental empty/negative/fractional-cent filter', () => {
    expect(parseTaxDataAmount('')).toBeUndefined();
    expect(parseTaxDataAmount('0.01')).toBe(1);
    expect(parseTaxDataAmount(' 12.50 ')).toBe(1250);
    for (const value of ['0', '-1', '1.005', 'NaN', '1e5', 'abc'])
      expect(parseTaxDataAmount(value)).toBeNull();
  });
  test('deduplicates by parcel rather than shared booking and refreshes replaced snapshots', () => {
    const merged = mergeTaxDataSelection([row('one')], [row('one', 15000), row('two')]);
    expect(merged.map((item) => item.parcelId)).toEqual(['one', 'two']);
    expect(merged[0]?.paidPrincipalPsw).toBe(15000);
    expect(sumTaxDataRows(merged).taxTotalPsw).toBe(4000);
  });
  test('enforces the 500-parcel batch limit without truncation', () => {
    const rows = Array.from({ length: 500 }, (_, i) => row(`parcel-${i}`));
    expect(mergeTaxDataSelection(rows, [rows[0]!])).toHaveLength(500);
    expect(() => mergeTaxDataSelection(rows, [row('extra')])).toThrow('500');
  });
});
