import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { canReturnParcelToSource } from '@/shared/shipments/return-to-source';

describe('return to source eligibility', () => {
  test.each([
    ParcelStatus.ARRIVED_AT_DESTINATION,
    ParcelStatus.CUSTOMER_CONTACTED,
    ParcelStatus.AWAITING_PICKUP,
    ParcelStatus.HOME_DELIVERY_REQUESTED,
    ParcelStatus.ADDRESS_COLLECTED,
    ParcelStatus.RETURNED_TO_OFFICE,
    ParcelStatus.DISCREPANCY,
  ])('allows an undelivered parcel at the destination (%i)', (status) => {
    expect(canReturnParcelToSource(status)).toBe(true);
  });

  test.each([
    ParcelStatus.IN_TRANSIT,
    ParcelStatus.DISPATCHED,
    ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    ParcelStatus.DELIVERED_BY_OFFICE,
    ParcelStatus.DELIVERED_AT_HOME,
    ParcelStatus.RETURN_TO_SOURCE,
  ])('blocks return when the parcel is not available at destination (%i)', (status) => {
    expect(canReturnParcelToSource(status)).toBe(false);
  });
});
