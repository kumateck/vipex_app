export type CashierSession = {
  id: string;
  cashierId: string;
  cashierName: string | null;
  branchId: string;
  shiftTypeId: string | null;
  scheduledStartTime: string;
  actualEndTime: string | null;
  openingBalancePsw: number;
  totalReceivedPsw: number;
  currentBalancePsw: number;
  closingBalancePsw: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CashierSessionSummary = {
  sessionId: string;
  amountPaidPsw: number;
  toBePaidPsw: number;
  totalSalesPsw: number;
  totalCreditCreatedPsw: number;
  totalToBePaidCollectedPsw: number;
  totalDeliveryFeeCollectedPsw: number;
  totalFullCashierExpectedPsw: number;
  mode: 'sender' | 'receiver' | 'delivery' | 'full';
};

export type CashierSessionType = {
  id: string;
  sessionType: string;
  startTime: string;
  endTime: string;
};

export type CashierDashboardData = {
  activeSession: CashierSession | null;
  activeSummary: CashierSessionSummary | null;
};

export type CashierDashboardAccess = {
  sessions: boolean;
  sessionTypes: boolean;
  openSession: boolean;
  closeSession: boolean;
  report: boolean;
};

export type CashierDashboardState = {
  access: CashierDashboardAccess;
  cashierType: number | null;
  data: CashierDashboardData;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
};

export type CashierSessionActionState = {
  sessionTypes: CashierSessionType[];
  opening: boolean;
  closing: boolean;
  loadingSessionTypes: boolean;
  actionError: string | null;
  loadSessionTypes: () => Promise<void>;
  openSession: (input: { sessionTypeId: string; openingBalanceCedis: number }) => Promise<boolean>;
  closeSession: (input: { sessionId: string; closingBalanceCedis: number }) => Promise<boolean>;
  clearActionError: () => void;
};
