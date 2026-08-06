import { describe, expect, test } from 'bun:test';
import {
  assertNoOutstandingStorageForHandover,
  assertValidStorageCollectionAmount,
  resolveAndValidateStorageWaiverAmountPsw,
  validateStorageWaiverReason,
} from '../../src/server/features/shipments/storage-accrual-guards';

describe('storage accrual guard rules', () => {
  test('blocks handover when storage is outstanding', () => {
    expect(() => assertNoOutstandingStorageForHandover(500)).toThrow(
      'Storage accrual must be settled or waived before handover',
    );
  });

  test('allows handover after full storage payment', () => {
    expect(() =>
      assertValidStorageCollectionAmount({
        outstandingPsw: 500,
        collectionPsw: 500,
      }),
    ).not.toThrow();

    expect(() => assertNoOutstandingStorageForHandover(0)).not.toThrow();
  });

  test('allows handover after full waiver', () => {
    const waivedPsw = resolveAndValidateStorageWaiverAmountPsw({
      outstandingPsw: 500,
      requestedPsw: null,
    });
    expect(waivedPsw).toBe(500);
    expect(() => assertNoOutstandingStorageForHandover(0)).not.toThrow();
  });

  test('rejects waiver without reason and rejects over-waiver', () => {
    expect(() => validateStorageWaiverReason('   ')).toThrow('Waiver reason is required');
    expect(() =>
      resolveAndValidateStorageWaiverAmountPsw({
        outstandingPsw: 500,
        requestedPsw: 600,
      }),
    ).toThrow('Waived amount cannot exceed outstanding storage accrual');
  });
});
