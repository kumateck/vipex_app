import { describe, expect, test } from 'bun:test';
import {
  exportDailyParcelAuditCsv,
  filterDailyParcelAuditRows,
  summarizeDailyParcelAudit,
} from './daily-parcel-audit.utils';
import type { DailyParcelAuditRow } from '../types/daily-parcel-audit.types';

const row: DailyParcelAuditRow = {
  parcelId: '1',
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
  senderPaidPsw: 4000,
  receiverExpectedPsw: 6000,
  receiverPaidPsw: 2500,
  receiverCreditedPsw: 0,
  receiverOutstandingPsw: 3500,
  paymentStatus: 'partial',
  deliveredAt: null,
  isDelivered: false,
  deliveryOfficer: null,
  senderCashier: null,
  receiverCashier: null,
};

describe('daily parcel audit views', () => {
  test('filters sender/receiver and delivery independently', () => {
    const delivered = {
      ...row,
      parcelId: '2',
      deliveredAt: '2026-10-04T12:00:00.000Z',
      isDelivered: true,
      receiverPaidPsw: 6000,
      receiverOutstandingPsw: 0,
      paymentStatus: 'paid' as const,
    };
    const rows = [row, delivered];
    expect(filterDailyParcelAuditRows(rows, 'receiver', 'partial', 'all')).toEqual([row]);
    expect(filterDailyParcelAuditRows(rows, 'sender', 'all', 'delivered')).toEqual([delivered]);
    expect(filterDailyParcelAuditRows(rows, 'receiver', 'all', 'pending')).toEqual([row]);
  });

  test('summaries and CSV use only displayed rows', () => {
    const totals = summarizeDailyParcelAudit([row]);
    expect(totals).toMatchObject({
      parcels: 1,
      delivered: 0,
      receiverPaidPsw: 2500,
      receiverOutstandingPsw: 3500,
    });
    expect(exportDailyParcelAuditCsv([row])).toContain('"TRACK-1"');
    expect(exportDailyParcelAuditCsv([{ ...row, receiverName: '=HYPERLINK("x")' }])).toContain(
      '"\'=HYPERLINK(""x"")"',
    );
  });
});
