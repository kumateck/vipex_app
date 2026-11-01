export type ParcelSearchRow = {
  id: string;
  companyId?: string;
  sourceId?: string;
  sourceName?: string | null;
  sourceLocationId?: string | null;
  sourceLocationName?: string | null;
  receiverId?: string;
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  parcelContent?: string | null;
  senderName?: string | null;
  senderPhone?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverPhone2?: string | null;
  secondReceiverId?: string | null;
  destinationId: string;
  destinationName?: string | null;
  destinationLocationId?: string | null;
  destinationLocationName?: string | null;
  pickupLocationName?: string | null;
  receivedAt?: string | null;
  callSender?: boolean;
  callCenterAssignedToUserId?: string | null;
  callCenterAssignedToUserName?: string | null;
  callCenterCalledAt?: string | null;
  status: number;
  chargeExemptCustomerType?: number | null;
  relatedStaffNameSnapshot?: string | null;
  chargePsw?: number;
  parcelValuePsw?: number;
  plannedToBePaidPsw: number;
  pickupQueueId?: string | null;
  pickupQueueCode?: string | null;
  pickupQueueNumber?: number | null;
  pickupQueuedAt?: string | null;
  riderUserId?: string | null;
  riderName?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  storageChargePsw?: number;
  storageChargeDays?: number;
  storageChargeStartAt?: string | null;
};

export type PickupQueueCard = {
  id: string;
  branchId: string;
  parcelId: string;
  paymentBucket: 'SP' | 'TP' | string;
  queueDate: string;
  queueNumber: number;
  queueCode: string;
  queuedBy: string;
  queuedAt: string;
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  plannedToBePaidPsw: number;
  chargePsw: number;
  receiverName: string | null;
  receiverPhone: string | null;
};

export type ParcelFullDetails = {
  parcel: {
    id: string;
    trackingCode: string;
    bookingCode: string;
    status: number;
    senderId: string;
    receiverId: string;
    sourceId: string;
    destinationId: string;
    parcelDetails: string;
    parcelContent: string;
    parcelValuePsw: number;
    chargeExemptCustomerType?: number | null;
    relatedStaffNameSnapshot?: string | null;
    chargePsw: number;
    plannedToBePaidPsw: number;
    createdAt: string;
    receivedAt: string | null;
    confirmedAt: string | null;
    createdBy?: string | null;
    processedBy?: string | null;
    receivedBy?: string | null;
    confirmedBy?: string | null;
    shelfPickerStaffId?: string | null;
    callSender?: boolean;
    isDeleted?: boolean;
    deletedBy?: string | null;
    deletedAt?: string | null;
    deleteReason?: string | null;
  };
  /** The parcel as list/search rows show it (names, phones, payer totals, holder). */
  summary?: (ParcelSearchRow & ParcelSummaryExtras) | null;
  /** User id -> full name for every person referenced in these details. */
  userNames?: Record<string, string>;
  pickupQueue: null | {
    id: string;
    queueCode: string;
    queueNumber: number;
    queuedAt: string;
    paymentBucket: string;
    queuedBy?: string | null;
    endedAt?: string | null;
    endedBy?: string | null;
    pickerStaffId?: string | null;
  };
  payments: Array<{
    id: string;
    companyId?: string;
    branchId?: string;
    parcelId?: string;
    component?: number;
    payer?: number;
    cashierType?: number;
    grossAmountPsw: number;
    method: number;
    cashierUserId?: string | null;
    receivedAt: string;
    receiptNo: string | null;
    notes?: string | null;
    voidedAt?: string | null;
    voidedBy?: string | null;
    voidReason?: string | null;
    createdAt?: string;
  }>;
  delivery: null | {
    id: string;
    status: string;
    dropoffAddress: string | null;
    deliveredAt: string | null;
    chargeExemptCustomerType?: number | null;
    relatedStaffNameSnapshot?: string | null;
    chargePsw: number;
    amountPaidPsw: number;
    mode?: number;
    riderUserId?: string | null;
    riderName?: string | null;
    riderAssignedAt?: string | null;
    riderCompletedAt?: string | null;
    returnedAt?: string | null;
    frontDeskUserId?: string | null;
    deliveryUserId?: string | null;
    receiverCalledConfirmedBy?: string | null;
    receiverCalledConfirmedAt?: string | null;
    confirmedBy?: string | null;
    confirmedAt?: string | null;
    createdBy?: string | null;
  };
  consignments?: Array<{
    consignmentId: string;
    code: string;
    consignmentDate: string;
    serialForDay: number;
    sourceId: string;
    destinationId: string;
    addedAt: string;
    removedAt: string | null;
  }>;
  internalHolder?: null | {
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
  dispositionActions?: Array<{
    id: string;
    actionType: number;
    notes: string | null;
    warehouseName: string | null;
    performedByName: string | null;
    performedAt: string | null;
    recoveredAmountPsw: number;
  }>;
  storageWaivers?: Array<{
    id: string;
    waivedAmountPsw: number;
    reason: string;
    waivedByName: string | null;
    waivedAt: string | null;
  }>;
  storageSettlement?: null | {
    parcelId: string;
    accruedPsw: number;
    paidPsw: number;
    waivedPsw: number;
    outstandingPsw: number;
  };
};

export type RiderDoorstepRecord = {
  deliveryId: string;
  parcelId: string;
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  parcelContent?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverId?: string;
  secondReceiverId?: string | null;
  secondReceiverName?: string | null;
  secondReceiverPhone?: string | null;
  dropoffAddress?: string | null;
  deliveryStatus: string;
  deliveryFeePsw?: number;
  amountPaidPsw?: number;
  plannedToBePaidPsw?: number;
  outstandingPrincipalPsw?: number;
  outstandingDeliveryFeePsw?: number;
  riderCollectedPrincipalPsw?: number;
  riderCollectedDeliveryFeePsw?: number;
  riderCollectionRecordedAt?: string | null;
  principalCollectableAtCompletionPsw?: number;
  deliveryFeeCollectableAtCompletionPsw?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type RiderDoorstepResponse = {
  rows: RiderDoorstepRecord[];
  totals: {
    expectedDeliveryFeePsw: number;
    expectedToBePaidPsw: number;
    expectedTotalPsw: number;
  };
};

export type RiderBenchmarkResponse = {
  rider: {
    completionRate: number;
    returnRate: number;
    averagePaidPsw: number;
    unresolvedOlderThanOneDay: number;
    completedCount: number;
    outstandingCount: number;
    totalKnown: number;
  };
  branchAverage: {
    completionRate: number;
    returnRate: number;
    averagePaidPsw: number;
    unresolvedOlderThanOneDay: number;
    completedCount: number;
    outstandingCount: number;
    totalKnown: number;
  };
  branch: {
    id: string;
    ridersCount: number;
    samples: number;
  };
};

/** List-row fields the details `summary` adds beyond the search row mobile already uses. */
export type ParcelSummaryExtras = {
  senderPhone2?: string | null;
  secondReceiverName?: string | null;
  secondReceiverPhone?: string | null;
  dropoffAddress?: string | null;
  createdByName?: string | null;
  riderName?: string | null;
  paidPrincipalPsw?: number;
  outstandingPrincipalPsw?: number;
  senderPaidPrincipalPsw?: number;
  receiverPaidPrincipalPsw?: number;
  deliveryFeePsw?: number | null;
  outstandingDeliveryFeePsw?: number;
};

export type ParcelHistoryEvent = {
  id: string;
  occurredAt: string;
  category: string;
  title: string;
  description: string | null;
  actorName: string | null;
  branchName: string | null;
};
