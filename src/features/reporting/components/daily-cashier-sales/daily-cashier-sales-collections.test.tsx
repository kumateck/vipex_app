import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CashierType, PaymentComponent } from '@/db/schemas/enums';
import type {
  DailyCashierSalesReport,
  DailyCashierSalesTransactionRow,
} from '../../api/reporting.api';
import { DailyCashierSalesSummary } from './daily-cashier-sales-summary';
import { DailyCashierSalesPrintDocument } from './daily-cashier-sales-print-document';
import { filterDailyCashierSalesReport } from './daily-cashier-sales-module-filter';
import { formatMoneyPsw } from './daily-cashier-sales-utils';

function payment(
  cashierType: number,
  component: number,
  grossAmountPsw: number,
): DailyCashierSalesTransactionRow {
  return {
    paymentId: `${cashierType}-${component}`,
    sessionId: 'session',
    parcelId: 'parcel',
    bookingCode: 'BOOK',
    trackingCode: 'TRACK',
    sourceBranchId: 'source',
    sourceBranchName: 'Kumasi',
    destinationBranchId: 'destination',
    destinationBranchName: 'Accra',
    parcelDetails: 'Parcel',
    parcelContent: 'Contents',
    payerName: 'Customer',
    cashierName: 'Cashier',
    branchName: 'Accra',
    whoPaid: 'Delivery',
    cashierType,
    component,
    method: 0,
    payer: 1,
    grossAmountPsw,
    netAmountPsw: grossAmountPsw,
    taxTotalPsw: 0,
    receivedAt: '2026-10-19T10:00:00Z',
  };
}
const report: DailyCashierSalesReport = {
  filters: {},
  generatedAt: '2026-10-19T12:00:00Z',
  sessions: [],
  toBePaidRows: [],
  totals: {
    sessions: 1,
    transactions: 3,
    grossPsw: 18000,
    netPsw: 18000,
    taxPsw: 0,
    toBePaidPsw: 9900,
  },
  cashierTypeTotals: { senderPsw: 0, receiverPsw: 9000, deliveryPsw: 9000 },
  paymentModeTotals: { cashPsw: 18000, mtnPsw: 0, telecelPsw: 0, airtelPsw: 0, creditPsw: 0 },
  transactions: [
    payment(CashierType.DELIVERY, PaymentComponent.PRINCIPAL, 3000),
    payment(CashierType.DELIVERY, PaymentComponent.DELIVERY_FEE, 6000),
    payment(CashierType.TOBEPAID, PaymentComponent.PRINCIPAL, 9000),
  ],
};

describe('cashier collection summary and print', () => {
  test('shows distinct received totals and distinguishes outstanding principal', () => {
    const html = renderToStaticMarkup(<DailyCashierSalesSummary report={report} />);
    const received = html.slice(html.indexOf('aria-label="Delivery cashier collections"'));
    expect(received).toContain('Delivery fees received');
    expect(received).toContain(formatMoneyPsw(6000));
    expect(received).toContain('To Be Paid received');
    expect(received).toContain(formatMoneyPsw(3000));
    expect(received).not.toContain(formatMoneyPsw(9900));
    expect(html).toContain('Outstanding To Be Paid');
    expect(html).not.toContain('Delivery Sales');
  });
  test('uses the loaded module filter and shows zero for an empty delivery scope', () => {
    const receiver = filterDailyCashierSalesReport(report, 'receiver');
    expect(renderToStaticMarkup(<DailyCashierSalesSummary report={receiver} />)).not.toContain(
      'Delivery fees received',
    );
    const empty = filterDailyCashierSalesReport({ ...report, transactions: [] }, 'delivery');
    const html = renderToStaticMarkup(<DailyCashierSalesSummary report={empty} />);
    expect(html).toContain('To Be Paid received');
    expect(html).toContain(formatMoneyPsw(0));
  });
  test('prints the same separate totals as the on-screen summary', () => {
    const html = renderToStaticMarkup(
      <DailyCashierSalesPrintDocument
        printRef={{ current: null }}
        companyName="Test"
        generatedAt={report.generatedAt}
        filters={[]}
        report={report}
        routeSummary={[]}
        activeTab="payments"
      />,
    );
    const start = html.indexOf('Delivery cashier collections');
    const summary = html.slice(start, html.indexOf('</section>', start));
    expect(summary).toContain('Delivery fees received');
    expect(summary).toContain(formatMoneyPsw(6000));
    expect(summary).toContain('To Be Paid received');
    expect(summary).toContain(formatMoneyPsw(3000));
    expect(summary).not.toContain(formatMoneyPsw(9900));
  });
});
