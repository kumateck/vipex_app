import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas';
import { callCenterAssignmentStatus } from './parcel-call-center-assignment';

describe('provisional call center assignment outcome', () => {
  test('newly assigned arrivals and returns default to customer pickup', () => {
    for (const status of [
      ParcelStatus.ARRIVED_AT_DESTINATION,
      ParcelStatus.CUSTOMER_CONTACTED,
      ParcelStatus.RETURNED_TO_OFFICE,
    ])
      expect(callCenterAssignmentStatus(status)).toBe(ParcelStatus.AWAITING_PICKUP);
  });

  test('reassignment preserves an existing pickup or delivery decision', () => {
    expect(callCenterAssignmentStatus(ParcelStatus.AWAITING_PICKUP)).toBe(
      ParcelStatus.AWAITING_PICKUP,
    );
    expect(callCenterAssignmentStatus(ParcelStatus.HOME_DELIVERY_REQUESTED)).toBe(
      ParcelStatus.HOME_DELIVERY_REQUESTED,
    );
  });
});
