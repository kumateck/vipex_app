import { ParcelStatus } from '@/db/schemas/enums';

export const STATUS_LABELS: Record<number, string> = {
  [ParcelStatus.ARRIVED_AT_DESTINATION]: 'Arrived at Destination',
  [ParcelStatus.CUSTOMER_CONTACTED]: 'Customer Contacted',
  [ParcelStatus.AWAITING_PICKUP]: 'Awaiting Pickup',
  [ParcelStatus.HOME_DELIVERY_REQUESTED]: 'Home Delivery Requested',
  [ParcelStatus.ADDRESS_COLLECTED]: 'Address Collected',
  [ParcelStatus.RETURNED_TO_OFFICE]: 'Returned to Office',
};
