export const ParcelStatus = {
  CREATED: 0,
  PROCESSED: 1,
  IN_TRANSIT: 2,
  ARRIVED_AT_DESTINATION: 3,
  CUSTOMER_CONTACTED: 4,
  AWAITING_PICKUP: 5,
  DELIVERED_BY_OFFICE: 6,
  HOME_DELIVERY_REQUESTED: 7,
  ADDRESS_COLLECTED: 8,
  DISPATCHED: 9,
  RIDER_GIVEN_PARCEL_TO_CUSTOMER: 10,
  DELIVERED_AT_HOME: 11,
  RETURNED_TO_OFFICE: 12,
  RETURNED_TO_SENDER: 13,
  CANCELLED: 14,
  DISCREPANCY: 15,
  AGED_IN_WAREHOUSE: 16,
  DISPOSED_BY_SALE: 17,
  DISPOSED_BY_DESTRUCTION: 18,
  DISPOSED_BY_DONATION: 19,
} as const;

const PARCEL_STATUS_LABELS: Record<number, string> = {
  [ParcelStatus.CREATED]: 'Created',
  [ParcelStatus.PROCESSED]: 'Processed',
  [ParcelStatus.IN_TRANSIT]: 'In Transit',
  [ParcelStatus.ARRIVED_AT_DESTINATION]: 'Arrived at Destination',
  [ParcelStatus.CUSTOMER_CONTACTED]: 'Customer Contacted',
  [ParcelStatus.AWAITING_PICKUP]: 'Awaiting Pickup',
  [ParcelStatus.DELIVERED_BY_OFFICE]: 'Delivered by Office',
  [ParcelStatus.HOME_DELIVERY_REQUESTED]: 'Home Delivery Requested',
  [ParcelStatus.ADDRESS_COLLECTED]: 'Address Collected',
  [ParcelStatus.DISPATCHED]: 'Dispatched',
  [ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER]: 'Rider Given Parcel To Customer',
  [ParcelStatus.DELIVERED_AT_HOME]: 'Delivered at Home',
  [ParcelStatus.RETURNED_TO_OFFICE]: 'Returned to Office',
  [ParcelStatus.RETURNED_TO_SENDER]: 'Returned to Sender',
  [ParcelStatus.CANCELLED]: 'Cancelled',
  [ParcelStatus.DISCREPANCY]: 'Discrepancy',
  [ParcelStatus.AGED_IN_WAREHOUSE]: 'Aged in Warehouse',
  [ParcelStatus.DISPOSED_BY_SALE]: 'Disposed by Sale',
  [ParcelStatus.DISPOSED_BY_DESTRUCTION]: 'Disposed by Destruction',
  [ParcelStatus.DISPOSED_BY_DONATION]: 'Disposed by Donation',
};

export function getParcelStatusLabel(status: number): string {
  return PARCEL_STATUS_LABELS[status] ?? `Status ${status}`;
}
