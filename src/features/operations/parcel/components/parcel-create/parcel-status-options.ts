import { ParcelStatus } from '@/db/schemas/enums';

export const PARCEL_STATUS_OPTIONS: Array<{ value: ParcelStatus; label: string }> = [
  { value: ParcelStatus.CREATED, label: 'Created' },
  { value: ParcelStatus.PROCESSED, label: 'Processed' },
  { value: ParcelStatus.IN_TRANSIT, label: 'In transit' },
  { value: ParcelStatus.ARRIVED_AT_DESTINATION, label: 'Arrived at destination' },
  { value: ParcelStatus.CUSTOMER_CONTACTED, label: 'Customer contacted' },
  { value: ParcelStatus.AWAITING_PICKUP, label: 'Awaiting pickup' },
  { value: ParcelStatus.DELIVERED_BY_OFFICE, label: 'Delivered by office' },
  { value: ParcelStatus.HOME_DELIVERY_REQUESTED, label: 'Home delivery requested' },
  { value: ParcelStatus.ADDRESS_COLLECTED, label: 'Address collected' },
  { value: ParcelStatus.DISPATCHED, label: 'Dispatched' },
  { value: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER, label: 'Rider gave parcel to customer' },
  { value: ParcelStatus.DELIVERED_AT_HOME, label: 'Delivered at home' },
  { value: ParcelStatus.RETURNED_TO_OFFICE, label: 'Returned to office' },
  { value: ParcelStatus.RETURNED_TO_SENDER, label: 'Returned to sender' },
  { value: ParcelStatus.CANCELLED, label: 'Cancelled' },
];
