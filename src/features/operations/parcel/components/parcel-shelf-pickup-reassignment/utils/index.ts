export const SHELF_PICKUP_REASSIGNMENT_PATH = '/parcels/shelf-pickup-reassignment';

export function shelfPickupReassignmentLink(bookingCode: string) {
  return `${SHELF_PICKUP_REASSIGNMENT_PATH}?search=${encodeURIComponent(bookingCode)}`;
}
