import { describe, expect, it } from 'bun:test';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import {
  getExpectedCollectionPsw,
  getOutstandingPrincipalPsw,
  getRiderCollectedPrincipalPsw,
} from './assigned-deliveries.utils';

function record(overrides: Partial<RiderDoorstepRecord>): RiderDoorstepRecord {
  return {
    deliveryId: 'delivery-1',
    parcelId: 'parcel-1',
    trackingCode: 'TRACK-1',
    bookingCode: 'BOOK-1',
    parcelDetails: 'Parcel',
    deliveryStatus: 'DISPATCHED',
    plannedToBePaidPsw: 3_000,
    deliveryFeePsw: 500,
    ...overrides,
  };
}

describe('rider partial-payment collection balances', () => {
  it('uses the ledger-derived outstanding principal instead of the original amount', () => {
    const partial = record({ outstandingPrincipalPsw: 1_000, outstandingDeliveryFeePsw: 500 });

    expect(getOutstandingPrincipalPsw(partial)).toBe(1_000);
    expect(getExpectedCollectionPsw(partial)).toBe(1_500);
  });

  it('caps a previously over-recorded rider collection at the collectable balance', () => {
    const legacyOverCollection = record({
      riderCollectionRecordedAt: '2026-08-25T12:00:00.000Z',
      riderCollectedPrincipalPsw: 3_000,
      principalCollectableAtCompletionPsw: 1_000,
    });

    expect(getRiderCollectedPrincipalPsw(legacyOverCollection)).toBe(1_000);
  });
});
