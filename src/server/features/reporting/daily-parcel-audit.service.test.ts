import { describe, expect, test } from 'bun:test';
import {
  buildDailyParcelAuditReport,
  getDailyParcelAuditReportSvc,
} from './daily-parcel-audit.service';
import type { DailyParcelAuditSourceRow } from './daily-parcel-audit.repository';

const base: DailyParcelAuditSourceRow = {
  parcelId: 'parcel-1',
  bookingCode: 'BOOK-1',
  trackingCode: 'TRACK-1',
  createdAt: '2026-10-03T09:00:00.000Z',
  sourceBranchId: 'branch-1',
  sourceBranchName: 'Kumasi',
  receiverName: 'Receiver',
  receiverTelephone: '0240000000',
  parcelDetails: 'Box',
  parcelContent: 'Clothes',
  chargePsw: 10000,
  plannedToBePaidPsw: 6000,
  senderPaidPsw: 4000,
  receiverPaidPsw: 0,
  receiverCreditedPsw: 0,
  deliveredAt: null,
  deliveryOfficer: null,
  senderCashier: null,
  receiverCashier: null,
  isDelivered: false,
};

const filters = { date: '2026-10-03', branchId: 'branch-1' };

describe('daily parcel audit', () => {
  test('keeps receiver payment separate from delivery confirmation', () => {
    const [row] = buildDailyParcelAuditReport(
      [{ ...base, deliveredAt: '2026-10-04T13:00:00.000Z', isDelivered: true, receiverPaidPsw: 0 }],
      filters,
    ).rows;
    expect(row?.paymentStatus).toBe('unpaid');
    expect(row?.deliveredAt).toBe('2026-10-04T13:00:00.000Z');
    expect(row?.isDelivered).toBe(true);
    expect(row?.receiverExpectedPsw).toBe(6000);
    expect(row?.receiverOutstandingPsw).toBe(6000);
  });

  test('handles partial, fully paid, and credited receiver balances', () => {
    const rows = buildDailyParcelAuditReport(
      [
        { ...base, receiverPaidPsw: 2500, plannedToBePaidPsw: 3500 },
        { ...base, parcelId: 'parcel-2', receiverPaidPsw: 6000, plannedToBePaidPsw: 0 },
        {
          ...base,
          parcelId: 'parcel-3',
          receiverPaidPsw: 1000,
          receiverCreditedPsw: 5000,
          plannedToBePaidPsw: 5000,
        },
      ],
      filters,
    ).rows;
    expect(rows.map((row) => row.paymentStatus)).toEqual(['partial', 'paid', 'credited']);
    expect(rows.map((row) => row.receiverOutstandingPsw)).toEqual([3500, 0, 0]);
  });

  test('never reports a negative outstanding balance', () => {
    const [row] = buildDailyParcelAuditReport(
      [{ ...base, receiverPaidPsw: 7000, plannedToBePaidPsw: 0 }],
      filters,
    ).rows;
    expect(row?.receiverOutstandingPsw).toBe(0);
  });

  test('does not call a fully sender-paid parcel receiver-paid', () => {
    const [row] = buildDailyParcelAuditReport(
      [{ ...base, senderPaidPsw: 10000, plannedToBePaidPsw: 0 }],
      filters,
    ).rows;
    expect(row?.paymentStatus).toBe('not-due');
    expect(row?.receiverExpectedPsw).toBe(0);
  });

  test('does not turn unpaid sender liability into receiver liability', () => {
    const [row] = buildDailyParcelAuditReport(
      [{ ...base, senderPaidPsw: 0, plannedToBePaidPsw: 0 }],
      filters,
    ).rows;
    expect(row?.receiverExpectedPsw).toBe(0);
    expect(row?.paymentStatus).toBe('not-due');
  });

  test('rejects impossible dates before querying', async () => {
    await expect(
      getDailyParcelAuditReportSvc({ companyId: 'company', branchId: null, date: '2026-02-30' }),
    ).rejects.toThrow('Invalid report date');
  });
});
