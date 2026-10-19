import { BadRequest } from '@/server/utils/http-error';
import {
  listDailyParcelAuditRowsRepo,
  type DailyParcelAuditSourceRow,
} from './daily-parcel-audit.repository';

export type DailyParcelAuditRow = {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: string;
  sourceBranchId: string;
  sourceBranchName: string;
  receiverName: string;
  receiverTelephone: string | null;
  parcelDetails: string;
  parcelContent: string;
  chargePsw: number;
  senderPaidPsw: number;
  receiverExpectedPsw: number;
  receiverPaidPsw: number;
  receiverCreditedPsw: number;
  receiverOutstandingPsw: number;
  paymentStatus: 'paid' | 'credited' | 'partial' | 'unpaid' | 'not-due';
  isDelivered: boolean;
  deliveredAt: string | null;
  deliveryOfficer: string | null;
  senderCashier: string | null;
  receiverCashier: string | null;
};

export function buildDailyParcelAuditReport(
  sourceRows: DailyParcelAuditSourceRow[],
  filters: { date: string; branchId: string | null },
) {
  const rows: DailyParcelAuditRow[] = sourceRows.map((row) => {
    const chargePsw = Number(row.chargePsw);
    const plannedToBePaidPsw = Number(row.plannedToBePaidPsw);
    const senderPaidPsw = Number(row.senderPaidPsw);
    const receiverPaidPsw = Number(row.receiverPaidPsw);
    const receiverCreditedPsw = Number(row.receiverCreditedPsw);
    const receiverExpectedPsw = Math.max(plannedToBePaidPsw + receiverPaidPsw, 0);
    const receiverOutstandingPsw = Math.max(plannedToBePaidPsw - receiverCreditedPsw, 0);
    return {
      parcelId: row.parcelId,
      bookingCode: row.bookingCode,
      trackingCode: row.trackingCode,
      createdAt: new Date(row.createdAt).toISOString(),
      sourceBranchId: row.sourceBranchId,
      sourceBranchName: row.sourceBranchName,
      receiverName: row.receiverName,
      receiverTelephone: row.receiverTelephone,
      parcelDetails: row.parcelDetails,
      parcelContent: row.parcelContent,
      chargePsw,
      senderPaidPsw,
      receiverExpectedPsw,
      receiverPaidPsw,
      receiverCreditedPsw,
      receiverOutstandingPsw,
      paymentStatus:
        receiverExpectedPsw === 0 && receiverPaidPsw === 0 && receiverCreditedPsw === 0
          ? 'not-due'
          : receiverOutstandingPsw === 0
            ? receiverCreditedPsw > 0
              ? 'credited'
              : 'paid'
            : receiverPaidPsw > 0 || receiverCreditedPsw > 0
              ? 'partial'
              : 'unpaid',
      isDelivered: row.isDelivered,
      deliveredAt: row.deliveredAt ? new Date(row.deliveredAt).toISOString() : null,
      deliveryOfficer: row.deliveryOfficer,
      senderCashier: row.senderCashier,
      receiverCashier: row.receiverCashier,
    };
  });

  return { filters, generatedAt: new Date().toISOString(), rows };
}

export async function getDailyParcelAuditReportSvc(input: {
  companyId: string;
  branchId: string | null;
  date: string;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw BadRequest('Invalid report date');
  const dayStart = new Date(`${input.date}T00:00:00.000Z`);
  if (Number.isNaN(dayStart.getTime()) || dayStart.toISOString().slice(0, 10) !== input.date) {
    throw BadRequest('Invalid report date');
  }
  // Ghana's civil date is UTC throughout the year.
  const nextDayStart = new Date(dayStart.getTime() + 86_400_000);
  const rows = await listDailyParcelAuditRowsRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    dayStart,
    nextDayStart,
  });
  return buildDailyParcelAuditReport(rows, { date: input.date, branchId: input.branchId });
}
