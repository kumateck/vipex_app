import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';

export const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const PARCEL_STATUS_LABELS: Record<number, string> = {
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
