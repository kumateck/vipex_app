import { ParcelStatus } from '@mobile/constants/parcel-status';
import type { PickupContext, PickupListQuery } from '../types';

export const PICKUP_PAGE_SIZE = 20;

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
  };
  if (term) query.search = term;
  const hasPickupQueue = getQueueFilterBySearch(isPickupQueueEnabled, term);
  if (hasPickupQueue !== undefined) query.hasPickupQueue = hasPickupQueue;
  return query;
}
