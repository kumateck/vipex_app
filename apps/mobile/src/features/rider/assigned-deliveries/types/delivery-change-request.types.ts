import type { RiderDoorstepRecord } from '@mobile/types/parcels';

export type RiderDeliveryChangeRequest = {
  deliveryId: string;
  parcelId: string;
  requestedDropoffAddress: string | null;
  requestedChargePsw: number | null;
  reason: string | null;
};

export type RiderDeliveryChangeTarget = Pick<
  RiderDoorstepRecord,
  'parcelId' | 'bookingCode' | 'dropoffAddress' | 'deliveryFeePsw'
>;

export type RiderDeliveryChangeInput = {
  requestedDropoffAddress: string;
  requestedDeliveryFeeCedis: string;
  reason: string;
};
