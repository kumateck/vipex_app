import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { assertRiderReturnReadyForPickup } from './rider-return-processing.rules';

const ready = {
  parcel: {
    companyId: 'company-a',
    destinationId: 'branch-a',
    status: ParcelStatus.RETURNED_TO_OFFICE,
    isDeleted: false,
  },
  delivery: { status: 'RETURNED_TO_OFFICE', returnedAt: new Date('2026-10-06T10:00:00Z') },
  companyId: 'company-a',
  branchId: 'branch-a',
};

describe('rider return reprocessing', () => {
  test('accepts a completed return at the staff branch', () => {
    expect(() => assertRiderReturnReadyForPickup(ready)).not.toThrow();
  });

  test('does not expose another company or branch', () => {
    expect(() => assertRiderReturnReadyForPickup({ ...ready, companyId: 'company-b' })).toThrow(
      'not found',
    );
    expect(() => assertRiderReturnReadyForPickup({ ...ready, branchId: 'branch-b' })).toThrow(
      'not found',
    );
    expect(() =>
      assertRiderReturnReadyForPickup({ ...ready, parcel: { ...ready.parcel, isDeleted: true } }),
    ).toThrow('not found');
  });

  test('rejects stale status and incomplete delivery returns', () => {
    expect(() =>
      assertRiderReturnReadyForPickup({
        ...ready,
        parcel: { ...ready.parcel, status: ParcelStatus.AWAITING_PICKUP },
      }),
    ).toThrow('Only rider-returned');
    expect(() =>
      assertRiderReturnReadyForPickup({
        ...ready,
        delivery: { ...ready.delivery, returnedAt: null },
      }),
    ).toThrow('no completed rider return');
    expect(() =>
      assertRiderReturnReadyForPickup({
        ...ready,
        delivery: { ...ready.delivery, status: 'DISPATCHED' },
      }),
    ).toThrow('no completed rider return');
  });
});
