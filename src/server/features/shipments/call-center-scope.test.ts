import { describe, expect, test } from 'bun:test';
import { callCenterParcelFilters, isParcelInCallCenterScope } from './call-center-scope';
import { assertCallCenterContactCandidate } from './parcel-call-center-contact.service';
import { validateBulkCallOutcomeCandidates } from './parcel-bulk-call-outcome.service';
import { assertMainReceiverChangeCandidate } from './parcel-main-receiver-change.rules';
import { ParcelStatus } from '@/db/schemas/enums';

const scope = { companyId: 'company', branchId: 'branch', locationId: 'hak', actorUserId: 'agent' };
const parcel = {
  id: 'parcel',
  companyId: scope.companyId,
  destinationId: scope.branchId,
  pickupLocationId: scope.locationId,
  callCenterAssignedToUserId: scope.actorUserId,
  callCenterCalledAt: null,
  isDeleted: false,
  status: ParcelStatus.AWAITING_PICKUP,
};

describe('call center location hierarchy', () => {
  test('assigned location is required even within the same branch', () => {
    expect(callCenterParcelFilters(scope)).toEqual({
      companyId: scope.companyId,
      destinationId: scope.branchId,
      locationId: 'hak',
    });
    expect(isParcelInCallCenterScope(parcel, scope)).toBe(true);
    for (const pickupLocationId of ['anloga', null, undefined]) {
      expect(isParcelInCallCenterScope({ ...parcel, pickupLocationId }, scope)).toBe(false);
    }
  });

  test('branch-only users can access every location in their branch', () => {
    const branchScope = { ...scope, locationId: null };
    expect(callCenterParcelFilters(branchScope).locationId).toBeNull();
    for (const pickupLocationId of ['hak', 'anloga', null, undefined]) {
      expect(isParcelInCallCenterScope({ ...parcel, pickupLocationId }, branchScope)).toBe(true);
    }
    expect(isParcelInCallCenterScope({ ...parcel, destinationId: 'other' }, branchScope)).toBe(
      false,
    );
    expect(isParcelInCallCenterScope({ ...parcel, companyId: 'other' }, branchScope)).toBe(false);
  });

  test('missing company or branch cannot produce an unrestricted scope', () => {
    for (const patch of [{ companyId: null }, { branchId: null }]) {
      expect(() => callCenterParcelFilters({ ...scope, ...patch })).toThrow('context');
      expect(isParcelInCallCenterScope(parcel, { ...scope, ...patch })).toBe(false);
    }
  });

  test('single outcomes, bulk outcomes, and receiver changes enforce the same location', () => {
    for (const pickupLocationId of ['anloga', null]) {
      const other = { ...parcel, pickupLocationId };
      expect(() => assertCallCenterContactCandidate(other, scope)).toThrow('not found');
      expect(() =>
        validateBulkCallOutcomeCandidates([parcel, other], ['parcel', 'other'], scope),
      ).toThrow('unavailable');
      expect(() => assertMainReceiverChangeCandidate(other, scope)).toThrow('not found');
      const branchScope = { ...scope, locationId: null };
      expect(() => assertCallCenterContactCandidate(other, branchScope)).not.toThrow();
      expect(() =>
        validateBulkCallOutcomeCandidates([other], [other.id], branchScope),
      ).not.toThrow();
      expect(() => assertMainReceiverChangeCandidate(other, branchScope)).not.toThrow();
    }
  });
});
