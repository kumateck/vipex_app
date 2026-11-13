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
