export type ParcelAnalyticsBasis = 'source' | 'destination';

export type ParcelAnalyticsQuery = {
  from: string;
  to: string;
  basis: ParcelAnalyticsBasis;
  branchId?: string;
  sourceId?: string;
  destinationId?: string;
  status?: number;
};

export type ParcelAnalyticsMetrics = {
  parcels: number;
  delivered: number;
  inTransit: number;
  awaitingPickup: number;
  returned: number;
  cancelled: number;
  uncollected7Days: number;
  chargePsw: number;
  receiverOutstandingPsw: number;
  completionRate: number;
  averageAgeDays: number;
  averageBookingToReceiptHours: number | null;
};

export type ParcelAnalyticsStatus = ParcelAnalyticsMetrics & { status: number; share: number };
export type ParcelAnalyticsBranch = ParcelAnalyticsMetrics & {
  branchId: string;
  branchName: string;
  statuses: Record<number, number>;
};

export type ParcelAnalyticsReport = {
  filters: ParcelAnalyticsQuery;
  generatedAt: string;
  totals: ParcelAnalyticsMetrics;
  previousParcels: number;
  volumeGrowthPct: number | null;
  statuses: ParcelAnalyticsStatus[];
  branches: ParcelAnalyticsBranch[];
  branchOptions: Array<{ id: string; name: string }>;
  trend: Array<{ day: string; parcels: number }>;
  aging: Array<{ label: string; parcels: number }>;
};

export type ParcelAnalyticsDetail = {
  id: string;
  bookingCode: string;
  trackingCode: string;
  status: number;
  sourceBranchName: string;
  destinationBranchName: string;
  createdAt: string;
  chargePsw: number;
  receiverOutstandingPsw: number;
};

export type ParcelAnalyticsDetails = {
  rows: ParcelAnalyticsDetail[];
  page: number;
  hasMore: boolean;
};
