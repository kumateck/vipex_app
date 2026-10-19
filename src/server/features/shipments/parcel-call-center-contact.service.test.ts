import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas';
import { assertCallCenterContactCandidate } from './parcel-call-center-contact.service';

const actor = { companyId: 'company-a', branchId: 'branch-a', actorUserId: 'caller-a' };
const parcel = {
  companyId: actor.companyId,
  destinationId: actor.branchId,
  callCenterAssignedToUserId: actor.actorUserId,
  callCenterCalledAt: null,
  status: ParcelStatus.AWAITING_PICKUP,
  isDeleted: false,
};

describe('call center contact eligibility', () => {
  test('an assigned provisional pickup can be called or changed to home delivery', () => {
    expect(() => assertCallCenterContactCandidate(parcel, actor)).not.toThrow();
    expect(() =>
      assertCallCenterContactCandidate(parcel, { ...actor, outcome: 'delivery' }),
    ).not.toThrow();
  });

  test('a dispatched parcel can be marked called without changing its delivery status', () => {
    const dispatched = { ...parcel, status: ParcelStatus.DISPATCHED };
    expect(() => assertCallCenterContactCandidate(dispatched, actor)).not.toThrow();
    expect(() =>
      assertCallCenterContactCandidate(dispatched, { ...actor, outcome: 'pickup' }),
    ).toThrow('can no longer change');
  });

  test('a called, delivered, deleted, or reassigned parcel cannot be called again', () => {
    for (const change of [
      { callCenterCalledAt: new Date() },
      { status: ParcelStatus.DELIVERED_BY_OFFICE },
      { status: ParcelStatus.DELIVERED_AT_HOME },
      { isDeleted: true },
      { callCenterAssignedToUserId: 'caller-b' },
    ])
      expect(() => assertCallCenterContactCandidate({ ...parcel, ...change }, actor)).toThrow();
  });
});
