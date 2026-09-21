import { describe, expect, test } from 'bun:test';
import { computeGhanaTaxesFromPesewas } from './ghana';

describe('Ghana parcel tax fallback', () => {
  test('computes non-zero tax for a taxable GHS 50 principal', () => {
    const breakdown = computeGhanaTaxesFromPesewas(5000n);

    expect(breakdown.totalTax).toBeGreaterThan(0n);
    expect(breakdown.net + breakdown.totalTax).toBe(5000n);
    expect(breakdown.vat).toBeGreaterThan(0n);
  });
});
