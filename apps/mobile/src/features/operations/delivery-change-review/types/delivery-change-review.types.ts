export type DeliveryChangeReview = {
  deliveryId: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  riderName: string | null;
  currentDropoffAddress: string | null;
  currentChargePsw: number;
  requestedDropoffAddress: string | null;
  requestedChargePsw: number | null;
  reason: string | null;
  requestedAt: string | null;
};

export type DeliveryChangeDecision = 'APPROVED' | 'REJECTED';
