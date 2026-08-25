export type RiderDailyAnalytics = {
  date: string;
  assignedCount: number;
  completedCount: number;
  returnedCount: number;
  totalAmountReceivedPsw: number;
  toBePaidReceivedPsw: number;
  deliveryFeeReceivedPsw: number;
};

export type RiderDashboardState = {
  canView: boolean;
  data: RiderDailyAnalytics;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
};
