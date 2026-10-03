import { describe, expect, test } from 'bun:test';
import type { DailyParcelAuditRow } from '../types/daily-parcel-audit.types';
import { buildDailyParcelAuditAnalytics } from './daily-parcel-audit-analytics';
import { filterDailyParcelAuditRows } from './daily-parcel-audit.utils';

const base: DailyParcelAuditRow = {
  parcelId: '1',
  bookingCode: 'BOOK-1',
  trackingCode: 'TRACK-1',
  createdAt: '2026-10-03T09:00:00.000Z',
  sourceBranchId: 'branch-1',
  sourceBranchName: 'Kumasi',
  receiverName: 'Receiver',
  receiverTelephone: null,
  parcelDetails: 'Box',
  parcelContent: 'Clothes',
  chargePsw: 10000,
  senderPaidPsw: 4000,
  receiverExpectedPsw: 6000,
  receiverPaidPsw: 2500,
  receiverCreditedPsw: 0,
  receiverOutstandingPsw: 3500,
  paymentStatus: 'partial',
  isDelivered: false,
  deliveredAt: null,
  deliveryOfficer: null,
  senderCashier: null,
  receiverCashier: null,
};

describe('daily parcel audit analytics', () => {
  test('uses the same filtered rows as the detail view', () => {
    const delivered: DailyParcelAuditRow = {
      ...base,
      parcelId: '2',
      createdAt: '2026-10-03T16:00:00.000Z',
      sourceBranchId: 'branch-2',
      sourceBranchName: 'Accra',
      paymentStatus: 'paid',
      receiverPaidPsw: 6000,
      receiverOutstandingPsw: 0,
      isDelivered: true,
    };
    const rows = filterDailyParcelAuditRows([base, delivered], 'receiver', 'all', 'delivered');
    const charts = buildDailyParcelAuditAnalytics(rows);

    expect(charts.paymentStatus).toEqual([{ label: 'Paid', value: 1 }]);
    expect(charts.deliveryStatus).toEqual([{ label: 'Delivered', value: 1 }]);
    expect(charts.branchParcels).toEqual([{ label: 'Accra', value: 1 }]);
    expect(charts.creationTime[4]).toEqual({ label: '16–19', value: 1 });
    expect(charts.amountsGhs).toContainEqual({ label: 'Receiver paid', value: 60 });
    expect(charts.amountsGhs).toContainEqual({ label: 'Outstanding', value: 0 });
  });

  test('separates receiver cash from credit and groups small branches', () => {
    const rows = Array.from(
      { length: 9 },
      (_, index): DailyParcelAuditRow => ({
        ...base,
        parcelId: String(index),
        sourceBranchId: String(index),
        sourceBranchName: `Branch ${index}`,
        receiverPaidPsw: 0,
        receiverCreditedPsw: 2500,
        receiverOutstandingPsw: 3500,
        paymentStatus: 'credited',
      }),
    );
    const charts = buildDailyParcelAuditAnalytics(rows);

    expect(charts.amountsGhs).toContainEqual({ label: 'Receiver paid', value: 0 });
    expect(charts.amountsGhs).toContainEqual({ label: 'Receiver credit', value: 225 });
    expect(charts.branchParcels.at(-1)).toEqual({ label: 'Other branches', value: 2 });
    expect(charts.branchParcels.reduce((sum, point) => sum + point.value, 0)).toBe(9);
  });

  test('has no misleading slices for an empty result', () => {
    const charts = buildDailyParcelAuditAnalytics([]);
    expect(charts.paymentStatus).toEqual([]);
    expect(charts.deliveryStatus).toEqual([]);
    expect(charts.branchParcels).toEqual([]);
  });
});
