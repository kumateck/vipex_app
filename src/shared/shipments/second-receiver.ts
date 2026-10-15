import { ParcelStatus } from '@/db/schemas/enums';

/**
 * Statuses in which destination-branch staff may add or replace a parcel's second receiver
 * from Shelf Picker Update or Parcel Assignment. Parcels already with a rider, delivered,
 * or returning to source are excluded.
 */
export const SECOND_RECEIVER_EDITABLE_STATUSES: readonly number[] = [
  ParcelStatus.ARRIVED_AT_DESTINATION,
  ParcelStatus.CUSTOMER_CONTACTED,
  ParcelStatus.RETURNED_TO_OFFICE,
  ParcelStatus.AWAITING_PICKUP,
  ParcelStatus.HOME_DELIVERY_REQUESTED,
];

export function canEditSecondReceiver(status: number) {
  return SECOND_RECEIVER_EDITABLE_STATUSES.includes(status);
}
