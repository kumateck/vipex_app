import { describe, expect, test } from 'bun:test';
import { CashierType, PaymentComponent, PaymentMethod, Payer } from '@/db/schemas/enums';
import type {
  DailyCashierSalesReport,
  DailyCashierSalesTransactionRow,
} from '@/features/reporting/api/reporting.api';
import {
  filterDailyCashierSalesReport,
  getTransactionCashierModule,
} from './daily-cashier-sales-module-filter';

function transaction(
  paymentId: string,
  cashierType: CashierType,
  payer: Payer,
  grossAmountPsw: number,
  method = PaymentMethod.CASH,
): DailyCashierSalesTransactionRow {
  return {
    paymentId,
    sessionId: 'session-1',
    parcelId: `parcel-${paymentId}`,
    bookingCode: `BOOK-${paymentId}`,
    trackingCode: `TRACK-${paymentId}`,
    parcelDetails: 'Parcel',
    parcelContent: 'Content',
    payerName: 'Customer',
    cashierName: 'Full Cashier',
    branchName: 'Accra',
    whoPaid: 'Customer',
    cashierType,
    method,
    component: PaymentComponent.PRINCIPAL,
    payer,
    grossAmountPsw,
    netAmountPsw: grossAmountPsw,
    taxTotalPsw: 0,
    receivedAt: '2026-08-29T10:00:00.000Z',
  };
}

const REPORT: DailyCashierSalesReport = {
  filters: {},
  generatedAt: '2026-08-29T12:00:00.000Z',
  totals: { sessions: 1, transactions: 3, toBePaidPsw: 500, grossPsw: 600, netPsw: 600, taxPsw: 0 },
  paymentModeTotals: { cashPsw: 400, mtnPsw: 200, telecelPsw: 0, airtelPsw: 0, creditPsw: 0 },
  cashierTypeTotals: { senderPsw: 100, receiverPsw: 200, deliveryPsw: 300 },
  sessions: [
    {
      id: 'session-1',
      cashierId: 'cashier-1',
      cashierName: 'Full Cashier',
      branchId: 'branch-1',
      branchName: 'Accra',
      locationId: null,
      locationName: null,
      scheduledStartTime: '2026-08-29T08:00:00.000Z',
      scheduledEndTime: '2026-08-29T17:00:00.000Z',
      status: 'ACTIVE',
      openingBalancePsw: 0,
      totals: {
        transactionCount: 3,
        grossPsw: 600,
        netPsw: 600,
        taxPsw: 0,
        cashPsw: 400,
        mtnPsw: 200,
        telecelPsw: 0,
        airtelPsw: 0,
        creditPsw: 0,
      },
    },
  ],
  transactions: [
    transaction('sender', CashierType.FULL, Payer.SENDER, 100),
    transaction('receiver', CashierType.FULL, Payer.RECIPIENT, 200, PaymentMethod.MTN),
    transaction('delivery', CashierType.DELIVERY, Payer.RECIPIENT, 300),
  ],
  toBePaidRows: [
    {
      parcelId: 'parcel-tbp',
      sessionId: 'session-1',
      bookingCode: 'BOOK-TBP',
      parcelDetails: 'Parcel',
      parcelContent: 'Content',
      plannedToBePaidPsw: 500,
      createdAt: '2026-08-29T09:00:00.000Z',
    },
  ],
};

describe('daily cashier sales loaded-report module filter', () => {
  test('classifies full-cashier payments using who paid', () => {
    expect(getTransactionCashierModule(REPORT.transactions[0]!)).toBe('sender');
    expect(getTransactionCashierModule(REPORT.transactions[1]!)).toBe('receiver');
    expect(getTransactionCashierModule(REPORT.transactions[2]!)).toBe('delivery');
  });

  test('filters sender data and keeps sender to-be-paid rows', () => {
    const report = filterDailyCashierSalesReport(REPORT, 'sender')!;

    expect(report.transactions.map((row) => row.paymentId)).toEqual(['sender']);
    expect(report.totals).toMatchObject({
      sessions: 1,
      transactions: 1,
      grossPsw: 100,
      toBePaidPsw: 500,
    });
    expect(report.cashierTypeTotals).toEqual({ senderPsw: 100, receiverPsw: 0, deliveryPsw: 0 });
    expect(report.toBePaidRows).toHaveLength(1);
  });

  test('filters receiver and delivery data without sender to-be-paid rows', () => {
    const receiver = filterDailyCashierSalesReport(REPORT, 'receiver')!;
    const delivery = filterDailyCashierSalesReport(REPORT, 'delivery')!;

    expect(receiver.transactions.map((row) => row.paymentId)).toEqual(['receiver']);
    expect(receiver.paymentModeTotals.mtnPsw).toBe(200);
    expect(receiver.toBePaidRows).toEqual([]);
    expect(delivery.transactions.map((row) => row.paymentId)).toEqual(['delivery']);
    expect(delivery.cashierTypeTotals.deliveryPsw).toBe(300);
  });
});
