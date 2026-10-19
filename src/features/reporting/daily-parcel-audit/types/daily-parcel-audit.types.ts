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

export type DailyParcelAuditReport = {
  filters: { date: string; branchId: string | null };
  generatedAt: string;
  rows: DailyParcelAuditRow[];
};

export type DailyParcelAuditView = 'receiver' | 'sender';
export type DailyParcelAuditStatus = 'all' | 'paid' | 'credited' | 'partial' | 'unpaid';
export type DailyParcelDeliveryStatus = 'all' | 'delivered' | 'pending';
