import type { RefObject } from 'react';
import type { DailyCashierSalesReport } from '@/features/reporting/api/reporting.api';
import { PrintableReportDocument } from '@/features/reporting/components/printable-report-document';
import { PAYMENT_METHOD_LABELS } from './daily-cashier-sales-constants';
import type {
  DailyCashierSalesFilterLabel,
  DailyCashierSalesReportTab,
} from './daily-cashier-sales-types';
import { formatDateTime, formatMoneyPsw } from './daily-cashier-sales-utils';

type DailyCashierSalesPrintDocumentProps = {
  printRef: RefObject<HTMLDivElement | null>;
  companyName: string;
  generatedAt: string;
  filters: DailyCashierSalesFilterLabel[];
  report?: DailyCashierSalesReport;
  activeTab: DailyCashierSalesReportTab;
};

export function DailyCashierSalesPrintDocument({
  printRef,
  companyName,
  generatedAt,
  filters,
  report,
  activeTab,
}: DailyCashierSalesPrintDocumentProps) {
  const isToBePaid = activeTab === 'tobepaid';

  return (
    <div className="hidden">
      <PrintableReportDocument
        ref={printRef}
        companyName={companyName}
        title={isToBePaid ? 'Daily Cashier To-Be-Paid Report' : 'Daily Cashier Sales Report'}
        subtitle={
          isToBePaid
            ? 'Outstanding to-be-paid parcels created in the selected sending session.'
            : 'Received payments with sender, receiver, and delivery cashier breakdown.'
        }
        generatedAt={generatedAt}
        filters={filters}
        sections={isToBePaid ? buildToBePaidSections(report) : buildPaymentSections(report)}
      />
    </div>
  );
}

function buildPaymentSections(report?: DailyCashierSalesReport) {
  return [
    {
      heading: 'Payment Mode Summary',
      headers: ['Mode', 'Amount'],
      rows: [
        ['Cash', formatMoneyPsw(report?.paymentModeTotals.cashPsw ?? 0)],
        ['MTN', formatMoneyPsw(report?.paymentModeTotals.mtnPsw ?? 0)],
        ['Telecel', formatMoneyPsw(report?.paymentModeTotals.telecelPsw ?? 0)],
        ['AirtelTigo', formatMoneyPsw(report?.paymentModeTotals.airtelPsw ?? 0)],
        ['Credit', formatMoneyPsw(report?.paymentModeTotals.creditPsw ?? 0)],
      ],
    },
    {
      heading: 'Who Paid Summary',
      headers: ['Who Paid', 'Amount'],
      rows: [
        ['Sender', formatMoneyPsw(report?.cashierTypeTotals.senderPsw ?? 0)],
        ['Receiver', formatMoneyPsw(report?.cashierTypeTotals.receiverPsw ?? 0)],
        ['Delivery', formatMoneyPsw(report?.cashierTypeTotals.deliveryPsw ?? 0)],
      ],
    },
    {
      heading: 'Payments',
      headers: ['Payment Time', 'Booking', 'Name', 'Who Paid', 'Method', 'Amount Paid'],
      rows:
        report?.transactions.map((row) => [
          formatDateTime(row.receivedAt),
          row.bookingCode,
          row.payerName,
          row.whoPaid,
          PAYMENT_METHOD_LABELS[row.method] ?? String(row.method),
          formatMoneyPsw(row.grossAmountPsw),
        ]) ?? [],
    },
  ];
}

function buildToBePaidSections(report?: DailyCashierSalesReport) {
  return [
    {
      heading: 'To Be Paid Summary',
      headers: ['Metric', 'Amount'],
      rows: [['Outstanding To Be Paid', formatMoneyPsw(report?.totals.toBePaidPsw ?? 0)]],
    },
    {
      heading: 'To Be Paid Parcels',
      headers: ['Created Time', 'Booking', 'Sender', 'Receiver', 'To Be Paid'],
      rows:
        report?.toBePaidRows.map((row) => [
          formatDateTime(row.createdAt),
          row.bookingCode,
          row.senderName ?? '-',
          row.receiverName ?? '-',
          formatMoneyPsw(row.plannedToBePaidPsw),
        ]) ?? [],
    },
  ];
}
