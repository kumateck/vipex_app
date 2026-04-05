export type ParcelSearchRow = {
  id: string;
  companyId?: string;
  sourceId?: string;
  receiverId?: string;
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  parcelContent?: string | null;
  senderName?: string | null;
  senderPhone?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  destinationId: string;
  destinationName?: string | null;
  status: number;
  chargePsw?: number;
  parcelValuePsw?: number;
  plannedToBePaidPsw: number;
  pickupQueueId?: string | null;
  pickupQueueCode?: string | null;
  pickupQueueNumber?: number | null;
  pickupQueuedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
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
    chargePsw: number;
    plannedToBePaidPsw: number;
    createdAt: string;
    receivedAt: string | null;
    confirmedAt: string | null;
  };
  pickupQueue: null | {
    id: string;
    queueCode: string;
    queueNumber: number;
    queuedAt: string;
    paymentBucket: string;
  };
  payments: Array<{
    id: string;
    grossAmountPsw: number;
    method: number;
    receivedAt: string;
    receiptNo: string | null;
  }>;
  delivery: null | {
    id: string;
    status: string;
    dropoffAddress: string | null;
    deliveredAt: string | null;
    chargePsw: number;
    amountPaidPsw: number;
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
  dropoffAddress?: string | null;
  deliveryStatus: string;
  deliveryFeePsw?: number;
  amountPaidPsw?: number;
  plannedToBePaidPsw?: number;
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
