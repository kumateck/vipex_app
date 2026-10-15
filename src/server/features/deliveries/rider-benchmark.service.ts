import { ParcelStatus } from '@/db/schemas/enums';
import {
  listDoorstepByBranchRepo,
  listDoorstepByRiderRepo,
  type RiderDeliveryRow,
} from './repository';

export async function listDoorstepByRiderSvc(input: {
  riderUserId: string;
  mode?: 'current' | 'history';
}) {
  const parcelStatuses =
    input.mode === 'history'
      ? [ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER, ParcelStatus.DELIVERED_AT_HOME]
      : [ParcelStatus.DISPATCHED];
  const rows = await listDoorstepByRiderRepo({
    riderUserId: input.riderUserId,
    parcelStatuses,
  });
  const totals = rows.reduce(
    (acc, row) => {
      acc.expectedDeliveryFeePsw += row.outstandingDeliveryFeePsw ?? 0;
      acc.expectedToBePaidPsw += row.outstandingPrincipalPsw ?? 0;
      return acc;
    },
    { expectedDeliveryFeePsw: 0, expectedToBePaidPsw: 0 },
  );
  return {
    rows,
    totals: {
      ...totals,
      expectedTotalPsw: totals.expectedDeliveryFeePsw + totals.expectedToBePaidPsw,
    },
  };
}

type RiderBenchmarkMetrics = {
  completionRate: number;
  returnRate: number;
  averagePaidPsw: number;
  unresolvedOlderThanOneDay: number;
  completedCount: number;
  outstandingCount: number;
  totalKnown: number;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function computeRiderBenchmarkMetrics(rows: RiderDeliveryRow[]): RiderBenchmarkMetrics {
  const completedStatuses = new Set([
    ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    ParcelStatus.DELIVERED_AT_HOME,
    ParcelStatus.RETURNED_TO_OFFICE,
  ]);
  const completedRows = rows.filter((row) => completedStatuses.has(row.parcelStatus));
  const outstandingRows = rows.filter((row) => row.parcelStatus === ParcelStatus.DISPATCHED);
  const completedCount = completedRows.length;
  const outstandingCount = outstandingRows.length;
  const totalKnown = completedCount + outstandingCount;
  const completionRate = totalKnown > 0 ? (completedCount / totalKnown) * 100 : 0;
  const returnedCount = completedRows.filter(
    (row) => row.parcelStatus === ParcelStatus.RETURNED_TO_OFFICE,
  ).length;
  const returnRate = completedCount > 0 ? (returnedCount / completedCount) * 100 : 0;
  const averagePaidPsw =
    completedCount > 0
      ? completedRows.reduce((sum, row) => sum + (row.amountPaidPsw ?? 0), 0) / completedCount
      : 0;
  const todayKey = startOfDay(new Date());
  const unresolvedOlderThanOneDay = outstandingRows.filter((row) => {
    const parsed = new Date(row.createdAt ?? row.updatedAt);
    if (Number.isNaN(parsed.getTime())) return false;
    return todayKey - startOfDay(parsed) >= 24 * 60 * 60 * 1000;
  }).length;

  return {
    completionRate,
    returnRate,
    averagePaidPsw,
    unresolvedOlderThanOneDay,
    completedCount,
    outstandingCount,
    totalKnown,
  };
}

export async function riderBranchBenchmarkSvc(input: { riderUserId: string; branchId: string }) {
  const parcelStatuses = [
    ParcelStatus.DISPATCHED,
    ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    ParcelStatus.DELIVERED_AT_HOME,
    ParcelStatus.RETURNED_TO_OFFICE,
  ];
  const [riderRowsAll, branchRows] = await Promise.all([
    listDoorstepByRiderRepo({
      riderUserId: input.riderUserId,
      parcelStatuses,
    }),
    listDoorstepByBranchRepo({
      branchId: input.branchId,
      parcelStatuses,
    }),
  ]);

  const riderRows = riderRowsAll.filter((row) => row.destinationId === input.branchId);
  const rider = computeRiderBenchmarkMetrics(riderRows);

  const branchRowsByRider = new Map<string, RiderDeliveryRow[]>();
  for (const row of branchRows) {
    const rowRiderUserId = row.riderUserId?.trim();
    if (!rowRiderUserId) continue;
    const existing = branchRowsByRider.get(rowRiderUserId);
    if (existing) {
      existing.push(row);
      continue;
    }
    branchRowsByRider.set(rowRiderUserId, [row]);
  }

  const perRiderMetrics = Array.from(branchRowsByRider.values()).map((rows) =>
    computeRiderBenchmarkMetrics(rows),
  );
  const ridersCount = perRiderMetrics.length;
  const branchAverage: RiderBenchmarkMetrics =
    ridersCount > 0
      ? {
          completionRate:
            perRiderMetrics.reduce((sum, row) => sum + row.completionRate, 0) / ridersCount,
          returnRate: perRiderMetrics.reduce((sum, row) => sum + row.returnRate, 0) / ridersCount,
          averagePaidPsw:
            perRiderMetrics.reduce((sum, row) => sum + row.averagePaidPsw, 0) / ridersCount,
          unresolvedOlderThanOneDay:
            perRiderMetrics.reduce((sum, row) => sum + row.unresolvedOlderThanOneDay, 0) /
            ridersCount,
          completedCount:
            perRiderMetrics.reduce((sum, row) => sum + row.completedCount, 0) / ridersCount,
          outstandingCount:
            perRiderMetrics.reduce((sum, row) => sum + row.outstandingCount, 0) / ridersCount,
          totalKnown: perRiderMetrics.reduce((sum, row) => sum + row.totalKnown, 0) / ridersCount,
        }
      : {
          completionRate: 0,
          returnRate: 0,
          averagePaidPsw: 0,
          unresolvedOlderThanOneDay: 0,
          completedCount: 0,
          outstandingCount: 0,
          totalKnown: 0,
        };

  return {
    rider,
    branchAverage,
    branch: {
      id: input.branchId,
      ridersCount,
      samples: branchRows.length,
    },
  };
}
