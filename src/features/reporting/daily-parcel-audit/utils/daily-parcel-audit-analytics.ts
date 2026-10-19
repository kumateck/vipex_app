import type { DailyParcelAuditRow } from '../types/daily-parcel-audit.types';
import { summarizeDailyParcelAudit } from './daily-parcel-audit.utils';

type ChartPoint = { label: string; value: number };

const PAYMENT_STATES = ['paid', 'credited', 'partial', 'unpaid', 'not-due'] as const;
const TIME_SLOTS = ['00–03', '04–07', '08–11', '12–15', '16–19', '20–23'];

export function buildDailyParcelAuditAnalytics(rows: DailyParcelAuditRow[]) {
  const totals = summarizeDailyParcelAudit(rows);
  const paymentCounts = new Map<string, number>();
  const branchCounts = new Map<string, { name: string; count: number }>();
  const hourlyCounts = Array<number>(6).fill(0);

  for (const row of rows) {
    paymentCounts.set(row.paymentStatus, (paymentCounts.get(row.paymentStatus) ?? 0) + 1);
    const branch = branchCounts.get(row.sourceBranchId);
    branchCounts.set(row.sourceBranchId, {
      name: row.sourceBranchName,
      count: (branch?.count ?? 0) + 1,
    });
    const timestamp = new Date(row.createdAt);
    if (!Number.isNaN(timestamp.getTime())) {
      // Ghana is UTC+0; use UTC hours so local browser timezone cannot move a parcel.
      const slot = Math.floor(timestamp.getUTCHours() / 4);
      hourlyCounts[slot] = (hourlyCounts[slot] ?? 0) + 1;
    }
  }

  const sortedBranches = [...branchCounts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
  const branchParcels: ChartPoint[] = sortedBranches.slice(0, 7).map((branch) => ({
    label: branch.name,
    value: branch.count,
  }));
  if (sortedBranches.length > 7) {
    branchParcels.push({
      label: 'Other branches',
      value: sortedBranches.slice(7).reduce((sum, branch) => sum + branch.count, 0),
    });
  }

  return {
    paymentStatus: PAYMENT_STATES.map((status) => ({
      label: status === 'not-due' ? 'Not due' : status.charAt(0).toUpperCase() + status.slice(1),
      value: paymentCounts.get(status) ?? 0,
    })).filter((point) => point.value > 0),
    deliveryStatus: [
      { label: 'Delivered', value: totals.delivered },
      { label: 'Pending', value: totals.parcels - totals.delivered },
    ].filter((point) => point.value > 0),
    amountsGhs: [
      { label: 'Sender paid', value: totals.senderPaidPsw / 100 },
      { label: 'Receiver paid', value: totals.receiverPaidPsw / 100 },
      { label: 'Receiver credit', value: totals.receiverCreditedPsw / 100 },
      { label: 'Outstanding', value: totals.receiverOutstandingPsw / 100 },
    ],
    branchParcels,
    creationTime: TIME_SLOTS.map((label, index) => ({ label, value: hourlyCounts[index] ?? 0 })),
  };
}
