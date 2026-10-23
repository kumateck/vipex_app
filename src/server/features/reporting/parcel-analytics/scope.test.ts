import { describe, expect, test } from 'bun:test';
import { BranchType } from '@/db/schemas/enums';
import type { ParcelAnalyticsQuery } from '@/shared/reporting';
import { analyticsDateBounds, resolveParcelAnalyticsScope } from './scope';

const query: ParcelAnalyticsQuery = { from: '2026-10-01', to: '2026-10-22', basis: 'source' };
const branchUser = { companyId: 'company', branchId: 'accra', branchType: BranchType.AGENCY };

describe('parcel analytics scope', () => {
  test('allows company-wide reporting only for head office', () => {
    expect(
      resolveParcelAnalyticsScope({ ...branchUser, branchType: BranchType.HEADOFFICE }, query)
        .branchId,
    ).toBeUndefined();
    expect(
      resolveParcelAnalyticsScope(
        { ...branchUser, branchType: BranchType.HEADOFFICE },
        { ...query, branchId: 'kumasi' },
      ).branchId,
    ).toBe('kumasi');
  });
  test('locks branch staff to their authenticated branch for incoming and outgoing', () => {
    for (const basis of ['source', 'destination'] as const) {
      expect(
        resolveParcelAnalyticsScope(branchUser, { ...query, basis, branchId: 'kumasi' }),
      ).toMatchObject({
        companyId: 'company',
        branchId: 'accra',
        lockedBranchId: 'accra',
        basis,
      });
    }
  });
  test('fails closed for missing company, branch and unknown branch type', () => {
    expect(() => resolveParcelAnalyticsScope({ branchType: 0 }, query)).toThrow('company context');
    expect(() => resolveParcelAnalyticsScope({ companyId: 'company' }, query)).toThrow(
      'branch context',
    );
    expect(
      resolveParcelAnalyticsScope({ companyId: 'company', branchId: 'accra' }, query).branchId,
    ).toBe('accra');
  });
  test('rejects invalid, reversed and oversized dates and unknown statuses', () => {
    for (const patch of [
      { from: '2026-02-30' },
      { to: '2026-09-30' },
      { to: '2027-10-02' },
      { status: 99 },
    ])
      expect(() => resolveParcelAnalyticsScope(branchUser, { ...query, ...patch })).toThrow();
    expect(resolveParcelAnalyticsScope(branchUser, { ...query, status: 0 }).status).toBe(0);
  });
  test('uses inclusive UTC civil dates and a previous period of equal length', () => {
    const dates = analyticsDateBounds({ from: '2026-10-01', to: '2026-10-01' });
    expect(dates.from.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(dates.until.toISOString()).toBe('2026-10-02T00:00:00.000Z');
    expect(dates.previousFrom.toISOString()).toBe('2026-09-30T00:00:00.000Z');
  });
  test('accepts exactly 366 days including leap-day periods', () => {
    expect(
      resolveParcelAnalyticsScope(branchUser, { ...query, from: '2024-01-01', to: '2024-12-31' }),
    ).toBeDefined();
    expect(() =>
      resolveParcelAnalyticsScope(branchUser, { ...query, from: '2024-01-01', to: '2025-01-01' }),
    ).toThrow();
  });
});
