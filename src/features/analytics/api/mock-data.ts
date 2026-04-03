import type { AnalyticsContract } from '../types';

export type TrendPoint = { label: string; value: number };

export type DefaultAnalyticsData = {
  todaySummary: {
    sent: number;
    received: number;
    delivered: number;
    pending: number;
  };
  alerts: {
    delayedParcels: number;
    failedDeliveries: number;
    pendingPickups: number;
  };
  activityTrend: TrendPoint[];
  topBranchesByVolume: Array<{ label: string; value: number }>;
  myStats: {
    handledParcelsToday: number;
    deliveredToday: number;
    pendingTasks: number;
  };
};

export type ExecutiveAnalyticsData = {
  revenueCards: {
    grossRevenuePsw: number;
    netRevenuePsw: number;
    growthPercent: number;
  };
  revenueByBranch: TrendPoint[];
  paymentDistribution: TrendPoint[];
};

export type FinancialAnalyticsData = {
  revenueBreakdown: TrendPoint[];
  cashVsMomo: TrendPoint[];
  refundsCount: number;
  taxSummaryPsw: number;
  transactions: Array<{
    id: string;
    date: string;
    method: string;
    amountPsw: number;
    status: string;
  }>;
};

export type BranchAnalyticsData = {
  branchPerformance: TrendPoint[];
  sentVsReceived: TrendPoint[];
  successRatePercent: number;
};

export type OperationalAnalyticsData = {
  statusBreakdown: TrendPoint[];
  delayedCount: number;
  avgProcessingMinutes: number;
};

export type PersonalAnalyticsData = {
  performance: {
    completedTasks: number;
    onTimeRatePercent: number;
    avgResolutionMinutes: number;
  };
};

export type AnalyticsSnapshot = {
  default: DefaultAnalyticsData;
  executive: ExecutiveAnalyticsData;
  financial: FinancialAnalyticsData;
  branch: BranchAnalyticsData;
  operational: OperationalAnalyticsData;
  personal: PersonalAnalyticsData;
};

function computeScopeFactor(scope: AnalyticsContract): number {
  if (scope.locationId && scope.locationId !== 'ALL') return 1;
  if (scope.branchId && scope.branchId !== 'ALL') return 3;
  return 6;
}

export function getMockAnalyticsSnapshot(scope: AnalyticsContract): AnalyticsSnapshot {
  const factor = computeScopeFactor(scope);

  return {
    default: {
      todaySummary: {
        sent: 42 * factor,
        received: 37 * factor,
        delivered: 33 * factor,
        pending: 9 * factor,
      },
      alerts: {
        delayedParcels: 2 * factor,
        failedDeliveries: Math.max(1, factor - 1),
        pendingPickups: 3 * factor,
      },
      activityTrend: [
        { label: 'Mon', value: 18 * factor },
        { label: 'Tue', value: 21 * factor },
        { label: 'Wed', value: 24 * factor },
        { label: 'Thu', value: 19 * factor },
        { label: 'Fri', value: 26 * factor },
        { label: 'Sat', value: 14 * factor },
        { label: 'Sun', value: 10 * factor },
      ],
      topBranchesByVolume: [
        { label: 'Kigali Central', value: 160 * factor },
        { label: 'Musanze', value: 134 * factor },
        { label: 'Rubavu', value: 121 * factor },
        { label: 'Huye', value: 115 * factor },
      ],
      myStats: {
        handledParcelsToday: 11 * factor,
        deliveredToday: 8 * factor,
        pendingTasks: 2 * factor,
      },
    },
    executive: {
      revenueCards: {
        grossRevenuePsw: 14500000 * factor,
        netRevenuePsw: 12200000 * factor,
        growthPercent: 8.4,
      },
      revenueByBranch: [
        { label: 'Kigali', value: 54000 * factor },
        { label: 'Huye', value: 39000 * factor },
        { label: 'Rubavu', value: 36000 * factor },
        { label: 'Musanze', value: 32000 * factor },
      ],
      paymentDistribution: [
        { label: 'Cash', value: 52 * factor },
        { label: 'MoMo', value: 39 * factor },
        { label: 'Credit', value: 9 * factor },
      ],
    },
    financial: {
      revenueBreakdown: [
        { label: 'Parcel Fees', value: 67000 * factor },
        { label: 'Delivery Fees', value: 22000 * factor },
        { label: 'Other', value: 9000 * factor },
      ],
      cashVsMomo: [
        { label: 'Cash', value: 56 * factor },
        { label: 'MoMo', value: 44 * factor },
      ],
      refundsCount: 4 * factor,
      taxSummaryPsw: 1900000 * factor,
      transactions: [
        { id: 'TX-1023', date: '2026-04-01', method: 'Cash', amountPsw: 35000, status: 'Posted' },
        { id: 'TX-1024', date: '2026-04-01', method: 'MoMo', amountPsw: 46000, status: 'Posted' },
        { id: 'TX-1025', date: '2026-04-02', method: 'Cash', amountPsw: 28000, status: 'Posted' },
        { id: 'TX-1026', date: '2026-04-02', method: 'MoMo', amountPsw: 51000, status: 'Posted' },
      ],
    },
    branch: {
      branchPerformance: [
        { label: 'Kigali', value: 89 * factor },
        { label: 'Huye', value: 73 * factor },
        { label: 'Rubavu', value: 68 * factor },
        { label: 'Musanze', value: 62 * factor },
      ],
      sentVsReceived: [
        { label: 'Sent', value: 126 * factor },
        { label: 'Received', value: 118 * factor },
      ],
      successRatePercent: 94.7,
    },
    operational: {
      statusBreakdown: [
        { label: 'Processed', value: 134 * factor },
        { label: 'In Transit', value: 49 * factor },
        { label: 'Delivered', value: 101 * factor },
        { label: 'Failed', value: 6 * factor },
      ],
      delayedCount: 7 * factor,
      avgProcessingMinutes: 38,
    },
    personal: {
      performance: {
        completedTasks: 23 * factor,
        onTimeRatePercent: 96.2,
        avgResolutionMinutes: 41,
      },
    },
  };
}
