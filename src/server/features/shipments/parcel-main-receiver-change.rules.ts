import { ParcelStatus } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';

export const mainReceiverChangeEligibleStatuses = [
  ParcelStatus.ARRIVED_AT_DESTINATION,
  ParcelStatus.RETURNED_TO_OFFICE,
  ParcelStatus.CUSTOMER_CONTACTED,
  ParcelStatus.AWAITING_PICKUP,
  ParcelStatus.HOME_DELIVERY_REQUESTED,
];

export function normalizeMainReceiverPhone(value: string) {
  const telephone = value.replace(/\D/g, '');
  if (!/^\d{10}$/.test(telephone)) throw BadRequest('New receiver telephone must be 10 digits');
  return telephone;
}

type Candidate = {
  companyId: string;
  destinationId: string;
  callCenterAssignedToUserId: string | null;
  isDeleted: boolean;
  status: number;
  callCenterCalledAt?: Date | null;
};

export function assertMainReceiverChangeCandidate<T extends Candidate>(
  parcel: T | null | undefined,
  context: { companyId: string; branchId: string; actorUserId: string },
): asserts parcel is T {
  if (
    !parcel ||
    parcel.companyId !== context.companyId ||
    parcel.destinationId !== context.branchId ||
    parcel.callCenterAssignedToUserId !== context.actorUserId ||
    parcel.isDeleted
  ) {
    throw NotFound('Assigned parcel not found at your branch');
  }
  if (parcel.callCenterCalledAt || !mainReceiverChangeEligibleStatuses.includes(parcel.status)) {
    throw Conflict('This parcel no longer allows a call outcome');
  }
}
