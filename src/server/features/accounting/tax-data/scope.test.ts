import { describe, expect, test } from 'bun:test';
import { resolveTaxDataScope, validateTaxDataFilters, validateTaxDataPage } from './scope';
const branch = resolveTaxDataScope({
  sub: 'staff',
  companyId: 'company',
  branchId: 'accra',
  branchType: 1,
});
const filters = { date: '2026-10-22', confirmation: 'unconfirmed' as const };
describe('tax data scope and validation', () => {
  test('forces authenticated source branch and allows company-wide access only at head office', () => {
    expect(validateTaxDataFilters(branch, { ...filters, branchId: 'other' }).branchId).toBe(
      'accra',
    );
    const head = resolveTaxDataScope({ sub: 'head', companyId: 'company', branchType: 0 });
    expect(validateTaxDataFilters(head, filters).branchId).toBeUndefined();
    expect(validateTaxDataFilters(head, { ...filters, branchId: 'kumasi' }).branchId).toBe(
      'kumasi',
    );
    expect(
      validateTaxDataFilters(branch, { ...filters, destinationBranchId: 'kumasi' }),
    ).toMatchObject({
      branchId: 'accra',
      destinationBranchId: 'kumasi',
    });
  });
  test('fails closed when company or branch context is absent', () => {
    expect(() => resolveTaxDataScope({ sub: 'staff', branchId: 'accra' })).toThrow(
      'company context',
    );
    expect(() => resolveTaxDataScope({ sub: 'staff', companyId: 'company' })).toThrow(
      'branch context',
    );
  });
  test('accepts leap days and rejects impossible dates and non-integer pesewas', () => {
    expect(
      validateTaxDataFilters(branch, { ...filters, date: '2024-02-29', amountPsw: 1 }).amountPsw,
    ).toBe(1);
    for (const date of ['2026-02-29', '2026-02-30', 'bad'])
      expect(() => validateTaxDataFilters(branch, { ...filters, date })).toThrow();
    for (const amountPsw of [0, -1, 1.5, Infinity])
      expect(() => validateTaxDataFilters(branch, { ...filters, amountPsw })).toThrow();
  });
  test('bounds pages and requires integer pagination', () => {
    expect(() => validateTaxDataPage(1, 50)).not.toThrow();
    expect(() => validateTaxDataPage(1, 1)).not.toThrow();
    for (const [page, limit] of [
      [0, 50],
      [1.5, 50],
      [10001, 50],
      [1, 0],
      [1, 101],
    ])
      expect(() => validateTaxDataPage(page!, limit!)).toThrow();
  });
  test('validates a total occurrence cap independent of page size', () => {
    expect(validateTaxDataFilters(branch, { ...filters, maxOccurrences: 1 }).maxOccurrences).toBe(
      1,
    );
    expect(validateTaxDataFilters(branch, { ...filters, maxOccurrences: 500 }).maxOccurrences).toBe(
      500,
    );
    for (const maxOccurrences of [0, -1, 1.5, 501, Infinity])
      expect(() => validateTaxDataFilters(branch, { ...filters, maxOccurrences })).toThrow(
        'Maximum occurrences',
      );
  });
});
