import { ParcelStatus } from '@mobile/constants/parcel-status';
import { isQueueDateToday } from '@mobile/features/operations/queue-management/utils';
import type { PickupContext, PickupListQuery, PickupParcel } from '../types';

export const PICKUP_PAGE_SIZE = 20;

export function getPickupQueueBadgeNumber(
  isPickupQueueEnabled: boolean,
  parcel: Pick<
    PickupParcel,
    'pickupQueueNumber' | 'pickupQueueEndedAt' | 'pickupQueueDate' | 'pickupQueuedAt'
  >,
  now = new Date(),
) {
  return isPickupQueueEnabled &&
    !parcel.pickupQueueEndedAt &&
    isQueueDateToday(parcel.pickupQueueDate, parcel.pickupQueuedAt, now)
    ? (parcel.pickupQueueNumber ?? null)
    : null;
}

/**
 * Same queue rule as the web Waiting for Pickup page: with pickup queues on,
 * the default list shows only queued parcels, but a search looks at every
 * eligible parcel so staff can still find one without a ticket.
 */
export function getQueueFilterBySearch(isPickupQueueEnabled: boolean, search?: string) {
  if (!isPickupQueueEnabled) return undefined;
  return search?.trim() ? undefined : true;
}

/**
 * Builds the GET /v1/shipments/parcels query for sender-paid parcels ready
 * for office pickup at the staff member's branch: Awaiting Pickup, with no
 * principal or storage balance left to collect. Returns null when nothing
 * should be fetched (no branch scope, or no search while queues are off).
 */
export function buildPickupListQuery(
  context: PickupContext,
  isPickupQueueEnabled: boolean,
  search: string,
  exactCode = false,
): PickupListQuery | null {
  if (!context.companyId || !context.branchId) return null;
  const term = search.trim();
  if (!isPickupQueueEnabled && !term) return null;

  const query: PickupListQuery = {
    page: 1,
    pageSize: PICKUP_PAGE_SIZE,
    companyId: context.companyId,
    destinationId: context.branchId,
    status: ParcelStatus.AWAITING_PICKUP,
    cashierCollectionRequired: false,
    pickupQueueTodayOnly: isPickupQueueEnabled,
  };
  if (term) {
    if (exactCode) query.parcelCode = term;
    else query.search = term;
  }
  const hasPickupQueue = getQueueFilterBySearch(isPickupQueueEnabled, term);
  if (hasPickupQueue !== undefined) query.hasPickupQueue = hasPickupQueue;
  return query;
}
