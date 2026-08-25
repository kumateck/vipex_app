export type DeliveryChangeRequest = {
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

export type DeliveryChangeRequestTarget = Pick<
  DeliveryChangeRequest,
  'parcelId' | 'bookingCode' | 'currentDropoffAddress' | 'currentChargePsw'
>;
