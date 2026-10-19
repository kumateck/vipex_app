import { ParcelStatus } from '@/db/schemas';

export function callCenterAssignmentStatus(status: number) {
  return [
    ParcelStatus.ARRIVED_AT_DESTINATION,
    ParcelStatus.CUSTOMER_CONTACTED,
    ParcelStatus.RETURNED_TO_OFFICE,
  ].includes(status)
    ? ParcelStatus.AWAITING_PICKUP
    : status;
}
