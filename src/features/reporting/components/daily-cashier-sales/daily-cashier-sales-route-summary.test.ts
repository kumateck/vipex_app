import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CashierType, PaymentComponent, PaymentMethod, Payer } from '@/db/schemas/enums';
import type { DailyCashierSalesTransactionRow } from '@/features/reporting/api/reporting.api';
import { filterDailyCashierSalesReport } from './daily-cashier-sales-module-filter';
import { summarizeCashierSalesByRoute } from './daily-cashier-sales-route-summary';
import { DailyCashierSalesRouteSummaryTable } from './daily-cashier-sales-route-summary-table';

function payment(
  id: string,
  overrides: Partial<DailyCashierSalesTransactionRow> = {},
): DailyCashierSalesTransactionRow {
  return {
    paymentId: id,
    parcelId: id,
    bookingCode: id,
    trackingCode: id,
    sourceBranchId: 'kumasi',
    sourceBranchName: 'Kumasi',
    destinationBranchId: 'accra',
    destinationBranchName: 'Accra',
    parcelDetails: 'Parcel',
    parcelContent: '',
    payerName: 'Customer',
    whoPaid: 'Receiver',
    cashierName: 'Accra Cashier',
    branchName: 'Accra',
    cashierType: CashierType.FULL,
    method: PaymentMethod.CASH,
    component: PaymentComponent.PRINCIPAL,
    payer: Payer.RECIPIENT,
    grossAmountPsw: 3_000,
    netAmountPsw: 3_000,
    taxTotalPsw: 0,
    receivedAt: '2026-10-07T10:00:00.000Z',
    ...overrides,
  };
}

describe('daily cashier sales route summary', () => {
  test('separates incoming routes and sender-paid outgoing routes', () => {
    const rows = summarizeCashierSalesByRoute([
      payment('kumasi-receiver'),
      payment('sunyani-receiver', {
        sourceBranchId: 'sunyani',
        sourceBranchName: 'Sunyani',
        grossAmountPsw: 2_000,
      }),
      payment('accra-sender', {
        sourceBranchId: 'accra',
        sourceBranchName: 'Accra',
        destinationBranchId: 'kumasi',
        destinationBranchName: 'Kumasi',
        payer: Payer.SENDER,
        method: PaymentMethod.MTN,
        grossAmountPsw: 4_000,
      }),
    ]);

    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.sourceBranchId === 'kumasi')).toMatchObject({
      destinationBranchId: 'accra',
      receiverPsw: 3_000,
      cashPsw: 3_000,
      grossPsw: 3_000,
    });
    expect(rows.find((row) => row.sourceBranchId === 'sunyani')).toMatchObject({
      receiverPsw: 2_000,
      grossPsw: 2_000,
    });
    expect(rows.find((row) => row.sourceBranchId === 'accra')).toMatchObject({
      senderPsw: 4_000,
      nonCashPsw: 4_000,
      grossPsw: 4_000,
    });
    expect(rows.reduce((sum, row) => sum + row.grossPsw, 0)).toBe(9_000);
  });

  test('groups by branch IDs, not names, and includes delivery payments once', () => {
    const rows = summarizeCashierSalesByRoute([
      payment('principal'),
      payment('fee', {
        cashierType: CashierType.DELIVERY,
        component: PaymentComponent.DELIVERY_FEE,
        grossAmountPsw: 500,
      }),
      payment('other-branch', {
        sourceBranchId: 'different-kumasi',
        sourceBranchName: 'Kumasi',
        grossAmountPsw: 100,
      }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.sourceBranchId === 'kumasi')).toMatchObject({
      transactions: 2,
      receiverPsw: 3_000,
      deliveryPsw: 500,
      grossPsw: 3_500,
    });
  });

  test('module-filtered rows yield only that module in the breakdown', () => {
    const sender = payment('sender', { payer: Payer.SENDER, grossAmountPsw: 1_000 });
    const receiver = payment('receiver', { grossAmountPsw: 2_000 });
    const report = {
      filters: {},
      generatedAt: '',
      sessions: [],
      toBePaidRows: [],
      totals: {
        sessions: 0,
        transactions: 2,
        toBePaidPsw: 0,
        grossPsw: 3_000,
        netPsw: 3_000,
        taxPsw: 0,
      },
      paymentModeTotals: { cashPsw: 3_000, mtnPsw: 0, telecelPsw: 0, airtelPsw: 0, creditPsw: 0 },
      cashierTypeTotals: { senderPsw: 1_000, receiverPsw: 2_000, deliveryPsw: 0 },
      transactions: [sender, receiver],
    };
    const filtered = filterDailyCashierSalesReport(report, 'receiver');
    expect(summarizeCashierSalesByRoute(filtered?.transactions ?? [])).toMatchObject([
      { receiverPsw: 2_000, senderPsw: 0, grossPsw: 2_000 },
    ]);
  });

  test('renders route names and collected amounts for cashier reconciliation', () => {
    const routes = summarizeCashierSalesByRoute([payment('kumasi-receiver')]);
    const markup = renderToStaticMarkup(
      createElement(DailyCashierSalesRouteSummaryTable, { routes }),
    );
    expect(markup).toContain('Kumasi');
    expect(markup).toContain('Accra');
    expect(markup).toContain('GH₵30.00');
  });

  test('uses branch IDs when a branch display name is unavailable', () => {
    const [route] = summarizeCashierSalesByRoute([
      payment('old-branch', { sourceBranchName: null, destinationBranchName: null }),
    ]);
    expect(route).toMatchObject({ sourceBranchName: 'kumasi', destinationBranchName: 'accra' });
  });
});
