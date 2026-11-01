export type ParcelStorageClearanceRow = {
  id: string;
  companyId: string;
  parcelId: string;
  status: number;
  requestedDays: number;
  accruedDaysAtRequest: number;
  dailyRatePsw: number;
  requestedAmountPsw: number;
  clearAll: boolean;
  reason: string;
  evidenceUrl: string | null;
  requestedBy: string;
  requestedByName: string | null;
  requestedAt: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  approvalNote: string | null;
  returnedBy: string | null;
  returnedByName: string | null;
  returnedAt: string | null;
  returnNote: string | null;
  rejectedBy: string | null;
  rejectedByName: string | null;
  rejectedAt: string | null;
  rejectionNote: string | null;
  executedBy: string | null;
  executedByName: string | null;
  executedAt: string | null;
  executedDays: number | null;
  executedAmountPsw: number | null;
  accountingJournalEntryId: string | null;
  accountingPostedAt: string | null;
  bookingCode: string;
  trackingCode: string;
  parcelStatus: number;
  senderName: string | null;
  receiverName: string | null;
};

export type ParcelStorageClearanceDetail = {
  request: Pick<
    ParcelStorageClearanceRow,
    | 'id'
    | 'parcelId'
    | 'status'
    | 'requestedDays'
    | 'requestedAmountPsw'
    | 'reason'
    | 'clearAll'
    | 'evidenceUrl'
  >;
  accruedDays: number;
  totalAccruedDays: number;
  dailyRatePsw: number;
  outstandingPsw: number;
  paidPsw: number;
  waivedPsw: number;
  remainingDays: number;
  history: {
    id: string;
    action: string;
    actorName: string | null;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }[];
};

export type ParcelDiscrepancyRow = {
  id: string;
  parcelId: string | null;
  branchId: string | null;
  branchName: string | null;
  trackingCode: string | null;
  bookingCode: string | null;
  discrepancyType: string;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  parcelStatus: number | null;
  sourceId: string | null;
  destinationId: string | null;
  pickupLocationId: string | null;
  destinationLocationName: string | null;
  senderName: string | null;
  receiverName: string | null;
};

export type ParcelReconciliationCaseRow = {
  id: string;
  companyId: string;
  parcelId: string;
  linkedParcelId: string | null;
  cashierSessionId: string | null;
  effectiveAt: string | null;
  originalChargePsw: number | null;
  proposedChargePsw: number | null;
  originalPlannedToBePaidPsw: number | null;
  proposedPlannedToBePaidPsw: number | null;
  caseType: number;
  actionType: number | null;
  status: number;
  notes: string | null;
  resolutionNote: string | null;
  evidenceUrl: string | null;
  requestedBy: string;
  requestedByName: string | null;
  requestedAt: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  executedBy: string | null;
  executedByName: string | null;
  executedAt: string | null;
  voidedPaymentCount: number;
  metadata: unknown;
  trackingCode: string;
  bookingCode: string;
  parcelStatus: number;
  sourceId: string;
  destinationId: string;
  currentChargePsw: number;
  currentPlannedToBePaidPsw: number;
  sessionCashierName: string | null;
  sessionScheduledStartTime: string | null;
  sessionScheduledEndTime: string | null;
  sessionStatus: string | null;
  linkedTrackingCode: string | null;
  linkedBookingCode: string | null;
};

export type ParcelCorrectionSession = {
  id: string;
  cashierId: string;
  cashierName: string | null;
  branchId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  status: string;
};

export type ParcelInternalHolderSnapshot = {
  parcelId: string;
  holderType: number;
  branchId: string | null;
  branchName: string | null;
  locationId: string | null;
  locationName: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  updatedAt: string;
};

export type HomeDeliveryReceipt = {
  bookingCode: string;
  trackingCode: string;
  parcelDetails: string;
  parcelContent: string;
  dropoffAddress: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderPhone2: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverPhone2: string | null;
  destinationName: string | null;
  chargeExemptCustomerType?: number | null;
  relatedStaffId?: string | null;
  relatedStaffNameSnapshot?: string | null;
  chargePsw: number;
  deliveryFeePsw: number;
  paidPrincipalPsw: number;
  paidDeliveryFeePsw: number;
  principalDuePsw: number;
  deliveryFeeDuePsw: number;
  totalDuePsw: number;
  grossPsw: number;
  netPsw: number;
  taxTotalPsw: number;
  taxRows: Array<{ label: string; amountPsw: number }>;
};
