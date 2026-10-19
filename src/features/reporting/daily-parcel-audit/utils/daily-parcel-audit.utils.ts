import type {
  DailyParcelAuditRow,
  DailyParcelAuditStatus,
  DailyParcelAuditView,
  DailyParcelDeliveryStatus,
} from '../types/daily-parcel-audit.types';

export function filterDailyParcelAuditRows(
  rows: DailyParcelAuditRow[],
  view: DailyParcelAuditView,
  paymentStatus: DailyParcelAuditStatus,
  deliveryStatus: DailyParcelDeliveryStatus,
) {
  return rows.filter((row) => {
    if (view === 'receiver' && row.receiverExpectedPsw <= 0 && row.receiverPaidPsw <= 0)
      return false;
    if (view === 'sender' && row.senderPaidPsw <= 0) return false;
    if (view === 'receiver' && paymentStatus !== 'all' && row.paymentStatus !== paymentStatus)
      return false;
    if (deliveryStatus === 'delivered' && !row.isDelivered) return false;
    if (deliveryStatus === 'pending' && row.isDelivered) return false;
    return true;
  });
}

export function summarizeDailyParcelAudit(rows: DailyParcelAuditRow[]) {
  return rows.reduce(
    (totals, row) => {
      totals.parcels += 1;
      totals.delivered += Number(row.isDelivered);
      totals.chargePsw += row.chargePsw;
      totals.senderPaidPsw += row.senderPaidPsw;
      totals.receiverExpectedPsw += row.receiverExpectedPsw;
      totals.receiverPaidPsw += row.receiverPaidPsw;
      totals.receiverCreditedPsw += row.receiverCreditedPsw;
      totals.receiverOutstandingPsw += row.receiverOutstandingPsw;
      return totals;
    },
    {
      parcels: 0,
      delivered: 0,
      chargePsw: 0,
      senderPaidPsw: 0,
      receiverExpectedPsw: 0,
      receiverPaidPsw: 0,
      receiverCreditedPsw: 0,
      receiverOutstandingPsw: 0,
    },
  );
}

export function formatMoneyPsw(value: number) {
  return `GH₵ ${(value / 100).toFixed(2)}`;
}

export function exportDailyParcelAuditCsv(rows: DailyParcelAuditRow[]) {
  const columns = [
    'Booking',
    'Tracking',
    'Created At',
    'Source Branch',
    'Receiver',
    'Telephone',
    'Details',
    'Content',
    'Charge (GHS)',
    'Sender Paid (GHS)',
    'Receiver Expected (GHS)',
    'Receiver Paid (GHS)',
    'Receiver Credited (GHS)',
    'Receiver Outstanding (GHS)',
    'Payment Status',
    'Delivery Status',
    'Delivered At',
    'Delivery Officer',
    'Sender Cashier',
    'Receiver Cashier',
  ];
  const quote = (value: string | number | null) => {
    const raw = String(value ?? '');
    const safe = typeof value === 'string' && /^\s*[=+@-]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const data = rows.map((row) => [
    row.bookingCode,
    row.trackingCode,
    row.createdAt,
    row.sourceBranchName,
    row.receiverName,
    row.receiverTelephone,
    row.parcelDetails,
    row.parcelContent,
    row.chargePsw / 100,
    row.senderPaidPsw / 100,
    row.receiverExpectedPsw / 100,
    row.receiverPaidPsw / 100,
    row.receiverCreditedPsw / 100,
    row.receiverOutstandingPsw / 100,
    row.paymentStatus,
    row.isDelivered ? 'Delivered' : 'Pending',
    row.deliveredAt,
    row.deliveryOfficer,
    row.senderCashier,
    row.receiverCashier,
  ]);
  return [columns, ...data].map((line) => line.map(quote).join(',')).join('\r\n');
}
