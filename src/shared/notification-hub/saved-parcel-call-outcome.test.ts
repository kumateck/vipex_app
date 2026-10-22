import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { getSavedParcelCallOutcome } from './saved-parcel-call-outcome';

describe('saved call outcome notification eligibility', () => {
  test.each([
    { status: ParcelStatus.AWAITING_PICKUP, outcome: 'pickup' },
    { status: ParcelStatus.HOME_DELIVERY_REQUESTED, outcome: 'delivery' },
    { status: ParcelStatus.CUSTOMER_CONTACTED, outcome: 'follow_up' },
  ])('maps saved outcome $outcome and requires a completed call', ({ status, outcome }) => {
    expect(getSavedParcelCallOutcome({ status, callCenterCalledAt: '2026-10-20T07:00:00Z' })).toBe(
      outcome,
    );
    expect(getSavedParcelCallOutcome({ status, callCenterCalledAt: new Date() })).toBe(outcome);
    expect(getSavedParcelCallOutcome({ status, callCenterCalledAt: null })).toBeNull();
    expect(getSavedParcelCallOutcome({ status })).toBeNull();
  });

  test.each([
    ParcelStatus.ARRIVED_AT_DESTINATION,
    ParcelStatus.RETURNED_TO_OFFICE,
    ParcelStatus.ADDRESS_COLLECTED,
    ParcelStatus.DISPATCHED,
    ParcelStatus.DELIVERED_BY_OFFICE,
    ParcelStatus.DELIVERED_AT_HOME,
    ParcelStatus.CANCELLED,
  ])('blocks stale notification outcomes at status %s', (status) => {
    expect(getSavedParcelCallOutcome({ status, callCenterCalledAt: new Date() })).toBeNull();
  });
});
