import { ParcelStatus } from '@/db/schemas/enums';

const RECEIPT_STATUSES = new Set<ParcelStatus>([
  ParcelStatus.ADDRESS_COLLECTED,
  ParcelStatus.RETURNED_TO_OFFICE,
  ParcelStatus.DISPATCHED,
  ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
  ParcelStatus.DELIVERED_AT_HOME,
]);

export function isHomeDeliveryReceiptStatus(status: number) {
  return RECEIPT_STATUSES.has(status as ParcelStatus);
}
