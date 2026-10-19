import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas';
import {
  assertMainReceiverChangeCandidate,
  normalizeMainReceiverPhone,
} from './parcel-main-receiver-change.rules';

const context = { companyId: 'company-a', branchId: 'branch-a', actorUserId: 'agent-a' };
const candidate = {
  companyId: context.companyId,
  destinationId: context.branchId,
  callCenterAssignedToUserId: context.actorUserId,
  isDeleted: false,
  status: ParcelStatus.ARRIVED_AT_DESTINATION,
};

describe('main receiver change guards', () => {
  test('normalizes a valid telephone and rejects incomplete numbers', () => {
    expect(normalizeMainReceiverPhone('024 811 1128')).toBe('0248111128');
    expect(() => normalizeMainReceiverPhone('0248111')).toThrow('10 digits');
  });

  test('accepts the active assigned parcel', () => {
    expect(() => assertMainReceiverChangeCandidate(candidate, context)).not.toThrow();
  });

  test('rejects another company, branch, agent, or a deleted parcel', () => {
    for (const patch of [
      { companyId: 'company-b' },
      { destinationId: 'branch-b' },
      { callCenterAssignedToUserId: 'agent-b' },
      { isDeleted: true },
    ]) {
      expect(() => assertMainReceiverChangeCandidate({ ...candidate, ...patch }, context)).toThrow(
        'not found',
      );
    }
  });

  test('rejects a parcel already moved past call outcome', () => {
    expect(() =>
      assertMainReceiverChangeCandidate(
        { ...candidate, status: ParcelStatus.DELIVERED_BY_OFFICE },
        context,
      ),
    ).toThrow('no longer allows');
  });
});
