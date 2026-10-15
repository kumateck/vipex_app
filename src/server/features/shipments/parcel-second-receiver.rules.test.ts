import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas';
import {
  assertNotMainReceiver,
  assertSecondReceiverCandidate,
  normalizeSecondReceiverInput,
} from './parcel-second-receiver.rules';

const context = { companyId: 'company-a', branchId: 'branch-a' };
const parcel = {
  companyId: context.companyId,
  destinationId: context.branchId,
  receiverId: 'customer-main',
  isDeleted: false,
  status: ParcelStatus.AWAITING_PICKUP,
};

describe('second receiver rules', () => {
  test('normalizes name and telephone, rejecting blanks and short numbers', () => {
    expect(
      normalizeSecondReceiverInput({ fullname: ' Ama Owusu ', telephone: '024 811 1128' }),
    ).toEqual({ fullname: 'Ama Owusu', telephone: '0248111128' });
    expect(() => normalizeSecondReceiverInput({ fullname: '  ', telephone: '0248111128' })).toThrow(
      'name is required',
    );
    expect(() => normalizeSecondReceiverInput({ fullname: 'Ama', telephone: '02481' })).toThrow(
      '10 digits',
    );
  });

  test('accepts a parcel at the staff branch before handover', () => {
    for (const status of [
      ParcelStatus.ARRIVED_AT_DESTINATION,
      ParcelStatus.CUSTOMER_CONTACTED,
      ParcelStatus.RETURNED_TO_OFFICE,
      ParcelStatus.AWAITING_PICKUP,
      ParcelStatus.HOME_DELIVERY_REQUESTED,
    ]) {
      expect(() => assertSecondReceiverCandidate({ ...parcel, status }, context)).not.toThrow();
    }
  });

  test('hides parcels from another company or branch and deleted parcels', () => {
    for (const change of [
      { companyId: 'company-b' },
      { destinationId: 'branch-b' },
      { isDeleted: true },
    ]) {
      expect(() => assertSecondReceiverCandidate({ ...parcel, ...change }, context)).toThrow(
        'not found',
      );
    }
    expect(() => assertSecondReceiverCandidate(null, context)).toThrow('not found');
  });

  test('rejects parcels already with a rider, delivered, or returning to source', () => {
    for (const status of [
      ParcelStatus.DISPATCHED,
      ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
      ParcelStatus.DELIVERED_BY_OFFICE,
      ParcelStatus.DELIVERED_AT_HOME,
      ParcelStatus.RETURN_TO_SOURCE,
    ]) {
      expect(() => assertSecondReceiverCandidate({ ...parcel, status }, context)).toThrow(
        'can no longer change',
      );
    }
  });

  test('rejects the main receiver as second receiver', () => {
    expect(() => assertNotMainReceiver(parcel, 'customer-main')).toThrow('main receiver');
    expect(() => assertNotMainReceiver(parcel, 'customer-other')).not.toThrow();
  });
});
