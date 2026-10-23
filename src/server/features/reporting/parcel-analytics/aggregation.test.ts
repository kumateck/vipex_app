import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { buildParcelAnalyticsReport } from './aggregation';
import type { AnalyticsGroup, AnalyticsScope } from './types';

const scope: AnalyticsScope = {
  companyId: 'company',
  basis: 'source',
  from: '2026-10-01',
  to: '2026-10-03',
};
const branches = [
  { id: 'accra', name: 'Accra' },
  { id: 'kumasi', name: 'Kumasi' },
];
const base: AnalyticsGroup = {
  branchId: 'accra',
  day: '2026-10-01',
  status: ParcelStatus.CREATED,
  parcels: 1,
  chargePsw: 1000,
  receiverOutstandingPsw: 500,
  ageDaysSum: 5,
  receiptHoursSum: 0,
  receiptSamples: 0,
  uncollected7Days: 0,
  age0To3: 0,
  age4To7: 0,
  age8To14: 0,
  age15Plus: 0,
};

describe('parcel analytics aggregation', () => {
  test('reconciles global, status, branch and daily counts without duplication', () => {
    const report = buildParcelAnalyticsReport(
      [
        base,
        {
          ...base,
          branchId: 'kumasi',
          parcels: 2,
          day: '2026-10-03',
          status: ParcelStatus.DELIVERED_AT_HOME,
        },
      ],
      scope,
      branches,
      2,
    );
    expect(report.totals.parcels).toBe(3);
    expect(report.branches.reduce((sum, row) => sum + row.parcels, 0)).toBe(3);
    expect(report.statuses.reduce((sum, row) => sum + row.parcels, 0)).toBe(3);
    expect(report.trend).toEqual([
      { day: '2026-10-01', parcels: 1 },
      { day: '2026-10-02', parcels: 0 },
      { day: '2026-10-03', parcels: 2 },
    ]);
    expect(report.totals.delivered).toBe(2);
    expect(report.totals.completionRate).toBeCloseTo(200 / 3);
    expect(report.volumeGrowthPct).toBe(50);
    expect(report.totals.chargePsw).toBe(2000);
    expect(report.totals.receiverOutstandingPsw).toBe(1000);
  });
  test('requires final delivery confirmation; separates returns, cancellations and collection', () => {
    const statuses = [
      ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
      ParcelStatus.RETURNED_TO_OFFICE,
      ParcelStatus.RETURNED_TO_SENDER,
      ParcelStatus.RETURN_TO_SOURCE,
      ParcelStatus.CANCELLED,
      ParcelStatus.AWAITING_PICKUP,
      ParcelStatus.IN_TRANSIT,
      ParcelStatus.DELIVERED_BY_OFFICE,
    ];
    const report = buildParcelAnalyticsReport(
      statuses.map((status) => ({ ...base, status })),
      scope,
      branches,
      0,
    );
    expect(report.totals).toMatchObject({
      parcels: 8,
      delivered: 1,
      returned: 3,
      cancelled: 1,
      awaitingPickup: 1,
      inTransit: 1,
      completionRate: 12.5,
    });
    expect(report.volumeGrowthPct).toBeNull();
  });
  test('weights average ages and receipt durations by parcels and valid samples', () => {
    const report = buildParcelAnalyticsReport(
      [
        { ...base, parcels: 2, ageDaysSum: 12, receiptHoursSum: 30, receiptSamples: 2 },
        { ...base, parcels: 1, ageDaysSum: 3, receiptHoursSum: 3, receiptSamples: 1 },
      ],
      scope,
      branches,
      0,
    );
    expect(report.totals.averageAgeDays).toBe(5);
    expect(report.totals.averageBookingToReceiptHours).toBe(11);
  });
  test('preserves all actual statuses, aging buckets and missing timestamps', () => {
    const report = buildParcelAnalyticsReport(
      [
        {
          ...base,
          status: ParcelStatus.AWAITING_PICKUP,
          parcels: 3,
          uncollected7Days: 2,
          age0To3: 1,
          age8To14: 1,
          age15Plus: 1,
        },
      ],
      scope,
      branches,
      0,
    );
    expect(report.statuses).toHaveLength(21);
    expect(report.aging.map((row) => row.parcels)).toEqual([1, 0, 1, 1]);
    expect(report.totals.uncollected7Days).toBe(2);
    expect(report.totals.averageBookingToReceiptHours).toBeNull();
  });
  test('returns a complete empty report and excludes internal security context', () => {
    const report = buildParcelAnalyticsReport(
      [],
      { ...scope, branchId: 'accra', lockedBranchId: 'accra' },
      branches,
      0,
    );
    expect(report.totals.parcels).toBe(0);
    expect(report.totals.completionRate).toBe(0);
    expect(report.totals.averageAgeDays).toBe(0);
    expect(report.statuses.every((row) => row.share === 0)).toBe(true);
    expect(report.filters).not.toHaveProperty('companyId');
    expect(report.filters).not.toHaveProperty('lockedBranchId');
  });
});
