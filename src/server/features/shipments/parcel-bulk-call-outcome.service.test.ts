import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas';
import {
  callOutcomeStatus,
  validateBulkCallOutcomeCandidates,
} from './parcel-bulk-call-outcome.service';

const context = { companyId: 'company-a', branchId: 'branch-a', actorUserId: 'caller-a' };
const candidate = {
  id: 'parcel-a',
  companyId: context.companyId,
  destinationId: context.branchId,
  callCenterAssignedToUserId: context.actorUserId,
  callCenterCalledAt: null,
  isDeleted: false,
  status: ParcelStatus.AWAITING_PICKUP,
};

describe('bulk call outcome candidates', () => {
  test('accepts provisional pickup and home-delivery choices before calling', () => {
    for (const status of [ParcelStatus.AWAITING_PICKUP, ParcelStatus.HOME_DELIVERY_REQUESTED]) {
      expect(() =>
        validateBulkCallOutcomeCandidates([{ ...candidate, status }], [candidate.id], context),
      ).not.toThrow();
    }
  });

  test('rejects parcels already called or delivered', () => {
    for (const change of [
      { callCenterCalledAt: new Date() },
      { status: ParcelStatus.DELIVERED_BY_OFFICE },
    ])
      expect(() =>
        validateBulkCallOutcomeCandidates([{ ...candidate, ...change }], [candidate.id], context),
      ).toThrow('no longer allow');
  });
});

test('keeps contacted pickup outcomes awaiting pickup', () => {
  expect(callOutcomeStatus('follow_up')).toBe(ParcelStatus.AWAITING_PICKUP);
  expect(callOutcomeStatus('pickup')).toBe(ParcelStatus.AWAITING_PICKUP);
  expect(callOutcomeStatus('delivery')).toBe(ParcelStatus.HOME_DELIVERY_REQUESTED);
});
