import { ParcelStatus } from '@/db/schemas/enums';
import { PARCEL_STATUS_LABELS } from '@/shared/shipments/parcel-status-labels';
import type { ParcelAnalyticsMetrics, ParcelAnalyticsReport } from '@/shared/reporting';
import type { AnalyticsGroup, AnalyticsScope } from './types';

const DELIVERED = new Set([ParcelStatus.DELIVERED_BY_OFFICE, ParcelStatus.DELIVERED_AT_HOME]);
const PICKUP = new Set([
  ParcelStatus.ARRIVED_AT_DESTINATION,
  ParcelStatus.CUSTOMER_CONTACTED,
  ParcelStatus.AWAITING_PICKUP,
]);
const RETURNED = new Set([
  ParcelStatus.RETURNED_TO_OFFICE,
  ParcelStatus.RETURNED_TO_SENDER,
  ParcelStatus.RETURN_TO_SOURCE,
]);

type Accumulator = ReturnType<typeof empty>;
function empty() {
  return {
    parcels: 0,
    delivered: 0,
    inTransit: 0,
    awaitingPickup: 0,
    returned: 0,
    cancelled: 0,
    uncollected7Days: 0,
    chargePsw: 0,
    receiverOutstandingPsw: 0,
    ageDaysSum: 0,
    receiptHoursSum: 0,
    receiptSamples: 0,
  };
}
function add(target: Accumulator, row: AnalyticsGroup) {
  const count = Number(row.parcels);
  target.parcels += count;
  if (DELIVERED.has(row.status)) target.delivered += count;
  if (PICKUP.has(row.status)) target.awaitingPickup += count;
  if (RETURNED.has(row.status)) target.returned += count;
  if (row.status === ParcelStatus.IN_TRANSIT) target.inTransit += count;
  if (row.status === ParcelStatus.CANCELLED) target.cancelled += count;
  for (const key of [
    'chargePsw',
    'receiverOutstandingPsw',
    'ageDaysSum',
    'receiptHoursSum',
    'receiptSamples',
    'uncollected7Days',
  ] as const)
    target[key] += Number(row[key]);
}
function metrics(row: Accumulator): ParcelAnalyticsMetrics {
  const { ageDaysSum, receiptHoursSum, receiptSamples, ...totals } = row;
  return {
    ...totals,
    completionRate: row.parcels ? (row.delivered / row.parcels) * 100 : 0,
    averageAgeDays: row.parcels ? ageDaysSum / row.parcels : 0,
    averageBookingToReceiptHours: receiptSamples ? receiptHoursSum / receiptSamples : null,
  };
}

export function buildParcelAnalyticsReport(
  groups: AnalyticsGroup[],
  scope: AnalyticsScope,
  branchOptions: Array<{ id: string; name: string }>,
  previousParcels: number,
  now = new Date(),
): ParcelAnalyticsReport {
  const total = empty();
  const statuses = new Map(Object.keys(PARCEL_STATUS_LABELS).map((key) => [Number(key), empty()]));
  const branches = new Map<string, { totals: Accumulator; statuses: Record<number, number> }>();
  const days = new Map<string, number>();
  for (
    let day = new Date(`${scope.from}T00:00:00Z`);
    day <= new Date(`${scope.to}T00:00:00Z`);
    day = new Date(day.getTime() + 86_400_000)
  )
    days.set(day.toISOString().slice(0, 10), 0);
  const aging = [0, 0, 0, 0];
  for (const row of groups) {
    add(total, row);
    const status = statuses.get(row.status) ?? empty();
    add(status, row);
    statuses.set(row.status, status);
    const branch = branches.get(row.branchId) ?? { totals: empty(), statuses: {} };
    add(branch.totals, row);
    branch.statuses[row.status] = (branch.statuses[row.status] ?? 0) + Number(row.parcels);
    branches.set(row.branchId, branch);
    days.set(row.day, (days.get(row.day) ?? 0) + Number(row.parcels));
    [row.age0To3, row.age4To7, row.age8To14, row.age15Plus].forEach((value, index) => {
      aging[index] = (aging[index] ?? 0) + Number(value);
    });
  }
  const names = new Map(branchOptions.map((branch) => [branch.id, branch.name]));
  const { companyId: _companyId, lockedBranchId: _lockedBranchId, ...filters } = scope;
  return {
    filters,
    generatedAt: now.toISOString(),
    totals: metrics(total),
    previousParcels,
    volumeGrowthPct: previousParcels
      ? ((total.parcels - previousParcels) / previousParcels) * 100
      : null,
    statuses: [...statuses].map(([status, data]) => ({
      status,
      ...metrics(data),
      share: total.parcels ? (data.parcels / total.parcels) * 100 : 0,
    })),
    branches: [...branches]
      .map(([branchId, data]) => ({
        branchId,
        branchName: names.get(branchId) ?? 'Unknown branch',
        ...metrics(data.totals),
        statuses: data.statuses,
      }))
      .sort((a, b) => b.parcels - a.parcels || a.branchName.localeCompare(b.branchName)),
    branchOptions,
    trend: [...days].map(([day, parcels]) => ({ day, parcels })),
    aging: ['0–3 days', '4–7 days', '8–14 days', '15+ days'].map((label, index) => ({
      label,
      parcels: aging[index] ?? 0,
    })),
  };
}
