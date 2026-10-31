import { ParcelStatus } from '@/db/schemas/enums';
import type { WorkflowEvidence, WorkflowParcel } from './types';

export function planReceivingWorkflow(
  parcel: WorkflowParcel,
  evidence: WorkflowEvidence,
  requestedLocationId?: string,
) {
  const { locations, latestStatusChange, deliveries } = evidence;
  let restriction: string | null = null;
  let pickupLocationId = parcel.pickup_location_id;
  let status = parcel.status;
  if (parcel.deleted_at || parcel.confirmed_at)
    restriction = 'Deleted or confirmed parcels cannot use this repair.';
  else if (![ParcelStatus.ARRIVED_AT_DESTINATION, ParcelStatus.AWAITING_PICKUP].includes(status))
    restriction = 'Only Arrived at Destination or Awaiting Pickup parcels can use this repair.';
  else if (
    deliveries.some(
      (delivery) =>
        delivery.delivered_at ||
        delivery.confirmed_at ||
        delivery.rider_completed_at ||
        ['DELIVERED', 'DELIVERED_AT_HOME', 'RIDER_GIVEN_PARCEL_TO_CUSTOMER'].includes(
          delivery.status,
        ) ||
        (delivery.mode === 1 && delivery.status !== 'RETURNED_TO_OFFICE'),
    )
  )
    restriction = 'A completed handover or active home delivery requires operational review.';

  if (!pickupLocationId) {
    const location = requestedLocationId
      ? locations.find((item) => item.id === requestedLocationId)
      : locations.length === 1
        ? locations[0]
        : undefined;
    if (!location)
      restriction ??= requestedLocationId
        ? 'Select a receiving location in this parcel’s destination branch and company.'
        : 'A unique receiving location could not be determined. Review availableLocations and enter the correct pickup location ID.';
    else pickupLocationId = location.id;
  } else if (requestedLocationId && requestedLocationId !== pickupLocationId) {
    restriction ??= 'The parcel already has a pickup location. This repair never replaces it.';
  }

  if (status === ParcelStatus.ARRIVED_AT_DESTINATION && parcel.call_center_called_at) {
    if (
      latestStatusChange?.previous_status === String(ParcelStatus.AWAITING_PICKUP) &&
      latestStatusChange.next_status === String(ParcelStatus.ARRIVED_AT_DESTINATION) &&
      new Date(latestStatusChange.created_at).getTime() >=
        new Date(parcel.call_center_called_at).getTime()
    )
      status = ParcelStatus.AWAITING_PICKUP;
    else
      restriction ??=
        'The called parcel has no matching Awaiting Pickup → Arrived regression after its call. Review its history before changing status.';
  }
  const changes: Record<string, string | number> = {};
  if (pickupLocationId && pickupLocationId !== parcel.pickup_location_id)
    changes.pickupLocationId = pickupLocationId;
  if (status !== parcel.status) changes.status = status;
  return {
    restriction,
    changes,
    after: { pickupLocationId, status },
    needsRepair: Object.keys(changes).length > 0,
  };
}
