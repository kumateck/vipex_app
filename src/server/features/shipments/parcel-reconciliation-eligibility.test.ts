import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { isParcelEligibleForReconciliation } from './parcel-reconciliation-eligibility';

describe('parcel reconciliation eligibility', () => {
  test.each([
    ParcelStatus.PROCESSED,
    ParcelStatus.IN_TRANSIT,
    ParcelStatus.ARRIVED_AT_DESTINATION,
    ParcelStatus.AWAITING_PICKUP,
    ParcelStatus.DISPATCHED,
    ParcelStatus.RETURNED_TO_OFFICE,
  ])('allows approval and execution before delivery at status %i', (status) => {
    expect(isParcelEligibleForReconciliation(status)).toBe(true);
  });

  test.each([
    ParcelStatus.DELIVERED_BY_OFFICE,
    ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    ParcelStatus.DELIVERED_AT_HOME,
  ])('excludes completed deliveries at status %i', (status) => {
    expect(isParcelEligibleForReconciliation(status)).toBe(false);
  });
});
