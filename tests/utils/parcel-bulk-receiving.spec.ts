import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas';
import {
  assertBulkArrivalCandidates,
  normalizeBulkArrivalParcelIds,
} from '@/server/features/shipments/parcel-bulk-receiving.service';
import type { BulkArrivalCandidate } from '@/server/features/shipments/parcel-bulk-receiving.repository';

function candidate(patch: Partial<BulkArrivalCandidate> = {}): BulkArrivalCandidate {
  return {
    id: 'parcel_1',
    companyId: 'company_1',
    destinationId: 'branch_1',
    bookingCode: 'BK-001',
    status: ParcelStatus.IN_TRANSIT,
    receivedAt: null,
    isDeleted: false,
    ...patch,
  };
}

describe('bulk incoming parcel arrival', () => {
  test('accepts unique selections within the batch limit', () => {
    expect(normalizeBulkArrivalParcelIds(['parcel_1', 'parcel_2'])).toEqual([
      'parcel_1',
      'parcel_2',
    ]);
  });

  test('rejects empty and duplicate selections', () => {
    expect(() => normalizeBulkArrivalParcelIds([])).toThrow('Select at least one parcel');
    expect(() => normalizeBulkArrivalParcelIds(['parcel_1', 'parcel_1'])).toThrow(
      'Duplicate parcel selections are not allowed',
    );
    expect(() =>
      normalizeBulkArrivalParcelIds(
        Array.from({ length: 101 }, (_, index) => `parcel_${index + 1}`),
      ),
    ).toThrow('Select no more than 100 parcels at a time');
  });

  test('accepts incoming parcels for the authenticated receiving branch', () => {
    expect(() =>
      assertBulkArrivalCandidates({
        requestedParcelIds: ['parcel_1'],
        candidates: [candidate()],
        companyId: 'company_1',
        branchId: 'branch_1',
      }),
    ).not.toThrow();
  });

  test('hides unavailable or out-of-scope selections', () => {
    expect(() =>
      assertBulkArrivalCandidates({
        requestedParcelIds: ['parcel_1'],
        candidates: [candidate({ destinationId: 'branch_2' })],
        companyId: 'company_1',
        branchId: 'branch_1',
      }),
    ).toThrow('One or more selected parcels are unavailable');
  });

  test('rejects the whole batch when a parcel is no longer eligible', () => {
    expect(() =>
      assertBulkArrivalCandidates({
        requestedParcelIds: ['parcel_1', 'parcel_2'],
        candidates: [
          candidate(),
          candidate({
            id: 'parcel_2',
            bookingCode: 'BK-002',
            status: ParcelStatus.ARRIVED_AT_DESTINATION,
            receivedAt: new Date('2026-08-29T12:00:00.000Z'),
          }),
        ],
        companyId: 'company_1',
        branchId: 'branch_1',
      }),
    ).toThrow('One or more selected parcels can no longer be marked as arrived');
  });
});
