import { ParcelStatus } from '@/db/schemas/enums';

/**
 * How a destination change is applied, by where the parcel is:
 * - `pre_dispatch`: still at the source branch; only the destination changes.
 * - `in_transit`: on its way; it leaves its consignment and the new branch receives it.
 * - `forward`: at the old destination; it is sent on as In Transit to the new branch.
 */
export type DestinationChangePhase = 'pre_dispatch' | 'in_transit' | 'forward';

const PHASE_BY_STATUS = new Map<number, DestinationChangePhase>([
  [ParcelStatus.CREATED, 'pre_dispatch'],
  [ParcelStatus.PROCESSED, 'pre_dispatch'],
  [ParcelStatus.IN_TRANSIT, 'in_transit'],
  [ParcelStatus.ARRIVED_AT_DESTINATION, 'forward'],
  [ParcelStatus.CUSTOMER_CONTACTED, 'forward'],
  [ParcelStatus.AWAITING_PICKUP, 'forward'],
  [ParcelStatus.RETURNED_TO_OFFICE, 'forward'],
  [ParcelStatus.DISCREPANCY, 'forward'],
  [ParcelStatus.AGED_IN_WAREHOUSE, 'forward'],
]);

const HOME_DELIVERY_STATUSES = new Set<number>([
  ParcelStatus.HOME_DELIVERY_REQUESTED,
  ParcelStatus.ADDRESS_COLLECTED,
  ParcelStatus.DISPATCHED,
]);

export const DESTINATION_CHANGE_REASON_MIN = 5;
export const DESTINATION_CHANGE_REASON_MAX = 500;

export const DESTINATION_CHANGE_EFFECTS: Record<DestinationChangePhase, string> = {
  pre_dispatch:
    'The parcel has not left the source branch. It is removed from any consignment and will be sent to the new destination.',
  in_transit:
    'The parcel is in transit. It is removed from its consignment; the new destination receives it with Scan to Receive or In Transit Incoming.',
  forward:
    'The parcel is at its current destination. It is forwarded: status returns to In Transit, its pickup queue, shelf picker and call-center assignment are cleared, and storage restarts when the new branch receives it.',
};

export function getDestinationChangePhase(status: number): DestinationChangePhase | null {
  return PHASE_BY_STATUS.get(status) ?? null;
}

export type DestinationChangeState = {
  status: number;
  isDeleted: boolean;
  confirmed: boolean;
  hasPendingReceiverHandover: boolean;
};

/** Returns why a parcel's destination cannot be changed, or null when it can. */
export function getDestinationChangeRestriction(parcel: DestinationChangeState): string | null {
  if (parcel.isDeleted) return 'Deleted parcels cannot change destination.';
  if (parcel.confirmed) return 'The parcel has already been handed to the customer.';
  if (parcel.hasPendingReceiverHandover)
    return 'The parcel is awaiting a Receiver Cashier signature. Finish or cancel the handover first.';
  if (HOME_DELIVERY_STATUSES.has(parcel.status))
    return 'The parcel is in home delivery. Record it as Returned to Office before changing the destination.';
  if (parcel.status === ParcelStatus.RETURN_TO_SOURCE)
    return 'The parcel is returning to its source branch.';
  if (!getDestinationChangePhase(parcel.status))
    return 'Destination can only change before the parcel is delivered.';
  return null;
}

export function normalizeDestinationChangeReason(reason: string): string | null {
  const trimmed = reason.trim();
  return trimmed.length >= DESTINATION_CHANGE_REASON_MIN &&
    trimmed.length <= DESTINATION_CHANGE_REASON_MAX
    ? trimmed
    : null;
}

export type DestinationOptionBranch = {
  id: string;
  name: string;
  locations: { id: string; name: string }[];
};

export type ParcelDestinationOptions = {
  restriction: string | null;
  phase: DestinationChangePhase | null;
  sourceId: string;
  destinationId: string;
  pickupLocationId: string | null;
  branches: DestinationOptionBranch[];
};
