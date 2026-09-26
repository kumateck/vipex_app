import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import {
  callOutcomeStatus,
  validateBulkCallOutcomeCandidates,
} from '@/server/features/shipments/parcel-bulk-call-outcome.service';
import { HttpStatus } from '@/server/utils/http-status';
import { http } from '../utils/request';

const context = { companyId: 'company-1', branchId: 'branch-1', actorUserId: 'agent-1' };
const candidate = {
  id: 'parcel-1',
  companyId: context.companyId,
  destinationId: context.branchId,
  callCenterAssignedToUserId: context.actorUserId,
  isDeleted: false,
  status: ParcelStatus.ARRIVED_AT_DESTINATION,
};

describe('bulk call outcome', () => {
  test('maps each outcome to its parcel status', () => {
    expect(callOutcomeStatus('follow_up')).toBe(ParcelStatus.AWAITING_PICKUP);
    expect(callOutcomeStatus('pickup')).toBe(ParcelStatus.AWAITING_PICKUP);
    expect(callOutcomeStatus('delivery')).toBe(ParcelStatus.HOME_DELIVERY_REQUESTED);
  });

  test('requires the parcels to remain assigned, in scope, and eligible', () => {
    expect(() =>
      validateBulkCallOutcomeCandidates([candidate], [candidate.id], context),
    ).not.toThrow();
    expect(() => validateBulkCallOutcomeCandidates([], [candidate.id], context)).toThrow(
      'One or more selected parcels are unavailable',
    );
    expect(() =>
      validateBulkCallOutcomeCandidates(
        [{ ...candidate, callCenterAssignedToUserId: 'another-agent' }],
        [candidate.id],
        context,
      ),
    ).toThrow('One or more selected parcels are unavailable');
    expect(() =>
      validateBulkCallOutcomeCandidates(
        [{ ...candidate, status: ParcelStatus.DELIVERED_BY_OFFICE }],
        [candidate.id],
        context,
      ),
    ).toThrow('One or more selected parcels no longer allow a call outcome');
  });

  test('the route requires authentication', async () => {
    const response = await http('POST', '/v1/shipments/parcels/bulk-call-outcome', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parcelIds: ['parcel-1'], outcome: 'pickup' }),
    });
    expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status);
  });
});
