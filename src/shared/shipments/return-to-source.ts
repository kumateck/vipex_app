import { ParcelStatus } from '@/db/schemas/enums';

const ELIGIBLE_STATUSES = new Set<ParcelStatus>([
  ParcelStatus.ARRIVED_AT_DESTINATION,
  ParcelStatus.CUSTOMER_CONTACTED,
  ParcelStatus.AWAITING_PICKUP,
  ParcelStatus.HOME_DELIVERY_REQUESTED,
  ParcelStatus.ADDRESS_COLLECTED,
  ParcelStatus.RETURNED_TO_OFFICE,
  ParcelStatus.DISCREPANCY,
]);

export function canReturnParcelToSource(status: number) {
  return ELIGIBLE_STATUSES.has(status);
}
