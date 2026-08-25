export type CashierSalesPaymentRow = {
  paymentId: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  parcelDetails: string;
  parcelContent: string;
  payerName: string;
  payerTelephone?: string | null;
  whoPaid: string;
  method: number;
  grossAmountPsw: number;
  receivedAt: string;
};

export type CashierSalesToBePaidRow = {
  parcelId: string;
  bookingCode: string;
  parcelDetails: string;
  parcelContent: string;
  senderName?: string | null;
  senderTelephone?: string | null;
  receiverName?: string | null;
  receiverTelephone?: string | null;
  plannedToBePaidPsw: number;
  createdAt: string;
};

export type CashierSalesReport = {
  generatedAt: string;
  totals: {
    sessions: number;
    transactions: number;
    toBePaidPsw: number;
    grossPsw: number;
    netPsw: number;
    taxPsw: number;
  };
  paymentModeTotals: {
    cashPsw: number;
    mtnPsw: number;
    telecelPsw: number;
    airtelPsw: number;
    creditPsw: number;
  };
  cashierTypeTotals: {
    senderPsw: number;
    receiverPsw: number;
    deliveryPsw: number;
  };
  transactions: CashierSalesPaymentRow[];
  toBePaidRows: CashierSalesToBePaidRow[];
};

export type CashierSalesReportTab = 'payments' | 'tobepaid';

export type CashierSalesReportState = {
  canView: boolean;
  selectedDate: string;
  appliedDate: string;
  report: CashierSalesReport | null;
  tab: CashierSalesReportTab;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  setTab: (tab: CashierSalesReportTab) => void;
  setSelectedDate: (date: string) => void;
  hasPendingDate: boolean;
  loadReport: () => void;
  refresh: () => void;
};
