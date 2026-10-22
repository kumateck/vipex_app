export type CashierSessionReportRow = {
  id: string;
  cashierId: string;
  branchId: string;
  scheduledStartTime: Date;
  actualEndTime: Date | null;
  openingBalancePsw: number;
  closingBalancePsw: number | null;
  status: string;
};

export type DailyCashConfirmationReportRow = {
  id: string;
  branchId: string;
  branchName: string | null;
  locationId: string | null;
  locationName: string | null;
  cashierUserId: string | null;
  cashierName: string | null;
  accountantUserId: string | null;
  accountantName: string | null;
  confirmationDate: Date;
  expectedCashPsw: number;
  countedCashPsw: number;
  shortagePsw: number;
  overagePsw: number;
  status: number;
  notes: string | null;
  confirmedAt: Date | null;
  postedAt: Date | null;
  createdAt: Date;
};

export type ExpenseByCategoryReportSummaryRow = {
  expenseCategoryId: string;
  expenseCategoryCode: string;
  expenseCategoryName: string;
  accountName: string | null;
  requests: number;
  totalAmountPsw: number;
  recordedPsw: number;
  submittedPsw: number;
  approvedPsw: number;
  paidPsw: number;
  postedPsw: number;
};

export type ExpenseByCategoryReportDetailRow = {
  id: string;
  branchId: string;
  branchName: string | null;
  locationId: string | null;
  locationName: string | null;
  expenseCategoryId: string;
  expenseCategoryCode: string;
  expenseCategoryName: string;
  amountPsw: number;
  fundingSource: number;
  status: number;
  purpose: string;
  referenceNo: string | null;
  requestedByUserId: string;
  requestedByName: string | null;
  approvedByUserId: string | null;
  approvedByName: string | null;
  paidByUserId: string | null;
  paidByName: string | null;
  paidAt: Date | null;
  postedAt: Date | null;
  createdAt: Date;
};

export type PayrollJournalReconciliationLineRow = {
  lineId: string;
  entryId: string;
  batchId: string;
  entryDate: Date;
  memo: string | null;
  accountId: string;
  accountCode: string;
  accountName: string;
  branchId: string | null;
  branchName: string | null;
  debitPsw: number;
  creditPsw: number;
  description: string | null;
  metadata: unknown;
};

export type DeliveryPerformanceReportRow = {
  deliveryId: string;
  parcelId: string;
  mode: number;
  deliveryStatus: string;
  parcelStatus: number;
  riderUserId: string | null;
  riderName: string | null;
  destinationBranchId: string;
  destinationBranchName: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  trackingCode: string;
  bookingCode: string;
  deliveryFeePsw: number;
  amountPaidPsw: number;
  plannedToBePaidPsw: number;
  dropoffAddress: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CashierSessionTransactionRow = {
  sessionId: string | null;
  paymentId: string;
  parcelId: string;
  trackingCode: string;
  method: number;
  component: number;
  payer: number;
  cashierType: number;
  grossAmountPsw: number;
  netAmountPsw: number;
  taxTotalPsw: number;
  receivedAt: Date;
  receiptNo: string | null;
};

export type DailyCashierSalesSessionRow = {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  locationId: string | null;
  locationName: string | null;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  status: string;
  openingBalancePsw: number;
  closingBalancePsw: number | null;
};

export type DailyCashierSalesTransactionRow = {
  sessionId: string;
  paymentId: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  sourceBranchId: string;
  sourceBranchName: string | null;
  destinationBranchId: string;
  destinationBranchName: string | null;
  parcelDetails: string;
  parcelContent: string;
  senderName: string | null;
  senderTelephone: string | null;
  receiverName: string | null;
  receiverTelephone: string | null;
  cashierType: number;
  method: number;
  component: number;
  payer: number;
  grossAmountPsw: number;
  netAmountPsw: number;
  taxTotalPsw: number;
  receivedAt: Date;
  receiptNo: string | null;
};

export type DailyCashierSalesToBePaidRow = {
  parcelId: string;
  sessionId: string | null;
  bookingCode: string;
  parcelDetails: string;
  parcelContent: string;
  senderName: string | null;
  senderTelephone: string | null;
  receiverName: string | null;
  receiverTelephone: string | null;
  plannedToBePaidPsw: number;
  createdAt: Date;
};

export type StorageWaiverFinancialReportRow = {
  waiverId: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  destinationBranchId: string;
  destinationBranchName: string | null;
  waivedAmountPsw: number;
  reason: string;
  waivedByUserId: string;
  waivedByName: string | null;
  waivedAt: Date;
  accountingJournalEntryId: string | null;
  accountingPostedAt: Date | null;
};

export type CreditExposureReportRow = {
  customerId: string;
  customerName: string;
  telephone: string | null;
  creditLimitPsw: number;
  outstandingPsw: number;
  oldestChargeAt: Date | null;
  bucketCurrentPsw: number;
  bucket1To30Psw: number;
  bucket31To60Psw: number;
  bucket61To90Psw: number;
  bucket91PlusPsw: number;
};

export type CustomerCreditAgingDetailReportRow = {
  customerId: string;
  customerName: string;
  telephone: string | null;
  chargeTransactionId: string;
  chargeCreatedAt: Date;
  sourceType: number;
  referenceId: string | null;
  notes: string | null;
  chargeAmountPsw: number;
  allocatedAmountPsw: number;
  outstandingAmountPsw: number;
  ageDays: number;
  agingBucket: 'current' | '1-30' | '31-60' | '61-90' | '91+';
};

export type ToBePaidOutstandingReportRow = {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: Date;
  status: number;
  sourceBranchId: string;
  sourceBranchName: string | null;
  destinationBranchId: string;
  destinationBranchName: string | null;
  senderName: string | null;
  receiverName: string | null;
  plannedToBePaidPsw: number;
  paidPrincipalPsw: number;
  outstandingPsw: number;
};

export type ToBePaidCollectionsReconciliationReportRow = {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: Date;
  status: number;
  sourceBranchId: string;
  sourceBranchName: string | null;
  destinationBranchId: string;
  destinationBranchName: string | null;
  senderName: string | null;
  receiverName: string | null;
  plannedToBePaidPsw: number;
  collectedPrincipalPsw: number;
  creditedPrincipalPsw: number;
  recognizedPrincipalPsw: number;
  outstandingPsw: number;
  variancePsw: number;
};
