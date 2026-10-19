import type { RefObject } from 'react';
import { PrintableReportDocument } from '@/features/reporting/components/printable-report-document';
import { formatDateTime } from '@/lib/dates';
import type {
  DailyParcelAuditRow,
  DailyParcelAuditView,
} from '../../types/daily-parcel-audit.types';
import { formatMoneyPsw, summarizeDailyParcelAudit } from '../../utils/daily-parcel-audit.utils';

export function DailyParcelAuditPrint({
  printRef,
  companyName,
  generatedAt,
  date,
  branchName,
  view,
  rows,
}: {
  printRef: RefObject<HTMLDivElement | null>;
  companyName: string;
  generatedAt: string;
  date: string;
  branchName: string;
  view: DailyParcelAuditView;
  rows: DailyParcelAuditRow[];
}) {
  const totals = summarizeDailyParcelAudit(rows);
  return (
    <div className="hidden">
      <PrintableReportDocument
        ref={printRef}
        companyName={companyName}
        title="Daily Parcel Audit"
        subtitle={view === 'receiver' ? 'Receiver to pay' : 'Sender-paid parcels'}
        generatedAt={generatedAt}
        filters={[
          { label: 'Creation date', value: date },
          { label: 'Source branch', value: branchName },
        ]}
        sections={[
          {
            heading: 'Summary',
            headers: [
              'Parcels',
              'Delivered',
              'Sender paid',
              'Receiver paid',
              'Receiver credited',
              'Receiver outstanding',
            ],
            rows: [
              [
                String(totals.parcels),
                String(totals.delivered),
                formatMoneyPsw(totals.senderPaidPsw),
                formatMoneyPsw(totals.receiverPaidPsw),
                formatMoneyPsw(totals.receiverCreditedPsw),
                formatMoneyPsw(totals.receiverOutstandingPsw),
              ],
            ],
          },
          {
            heading: 'Parcel details',
            headers: [
              'Booking / Tracking',
              'Receiver',
              'Parcel',
              'Branch',
              'Principal amounts',
              'Delivered',
              'Officer / Cashier',
            ],
            rows: rows.map((row) => [
              `${row.bookingCode} / ${row.trackingCode}`,
              `${row.receiverName} / ${row.receiverTelephone || '-'}`,
              `${row.parcelDetails} / ${row.parcelContent}`,
              row.sourceBranchName,
              `Charge ${formatMoneyPsw(row.chargePsw)}; sender ${formatMoneyPsw(row.senderPaidPsw)}; receiver ${formatMoneyPsw(row.receiverPaidPsw)}; credit ${formatMoneyPsw(row.receiverCreditedPsw)}; due ${formatMoneyPsw(row.receiverOutstandingPsw)}`,
              row.isDelivered
                ? row.deliveredAt
                  ? formatDateTime(row.deliveredAt)
                  : 'Delivered'
                : 'Pending',
              `${row.deliveryOfficer || '-'} / ${view === 'receiver' ? row.receiverCashier || '-' : row.senderCashier || '-'}`,
            ]),
          },
        ]}
      />
    </div>
  );
}
