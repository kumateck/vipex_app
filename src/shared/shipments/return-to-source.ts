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

export function getReturnToSourceUnavailableReason(
  parcel: { destinationId: string; status: number; isDeleted: boolean },
  branchId: string | null,
  canRecordReturn: boolean,
) {
  if (!canRecordReturn) return 'Your role needs the Update Parcels permission (CanUpdateParcels).';
  if (!branchId) return 'Sign in with a destination branch assigned to your account.';
  if (branchId !== parcel.destinationId)
    return 'Only staff signed into this parcel’s destination branch can return it to source.';
  if (parcel.isDeleted) return 'Deleted parcels cannot be returned to source.';
  if (!canReturnParcelToSource(parcel.status))
    return 'Return to Source is available only while the parcel is at the destination office, before customer handover. Return dispatched parcels to the office first.';
  return null;
}
