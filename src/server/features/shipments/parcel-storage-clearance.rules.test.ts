import { describe, expect, test } from 'bun:test';
import {
  getStorageClearanceDaysError,
  getStorageClearanceExecutionError,
} from './parcel-storage-clearance.rules';

describe('storage clearance day rules', () => {
  test('allows a partial clearance within current accrual', () => {
    expect(getStorageClearanceDaysError({ requestedDays: 2, accruedDays: 5 })).toBeNull();
  });

  test('allows clearing all currently accrued days', () => {
    expect(getStorageClearanceDaysError({ requestedDays: 5, accruedDays: 5 })).toBeNull();
  });

  test('rejects zero, negative, and fractional days', () => {
    expect(getStorageClearanceDaysError({ requestedDays: 0, accruedDays: 5 })).toContain(
      'whole number',
    );
    expect(getStorageClearanceDaysError({ requestedDays: -1, accruedDays: 5 })).toContain(
      'whole number',
    );
    expect(getStorageClearanceDaysError({ requestedDays: 1.5, accruedDays: 5 })).toContain(
      'whole number',
    );
  });

  test('allows a request above current accrual for human review', () => {
    expect(getStorageClearanceDaysError({ requestedDays: 6, accruedDays: 5 })).toBeNull();
  });

  test('rejects days outside the database integer range', () => {
    expect(getStorageClearanceDaysError({ requestedDays: 2147483648, accruedDays: 5 })).toContain(
      'whole number',
    );
  });
});

describe('storage clearance execution rules', () => {
  const current = {
    requestedDays: 2,
    accruedDays: 5,
    clearAll: false,
    requestedAmountPsw: 400,
    requestedRatePsw: 200,
    currentRatePsw: 200,
    outstandingPsw: 1000,
  };

  test('allows approved partial days while further fees have accrued', () => {
    expect(getStorageClearanceExecutionError(current)).toBeNull();
  });
  test('refuses execution with no remaining accrual', () => {
    expect(
      getStorageClearanceExecutionError({ ...current, accruedDays: 0, outstandingPsw: 0 }),
    ).toContain('no outstanding');
  });
  test('requires review of an outdated Clear All snapshot', () => {
    expect(getStorageClearanceExecutionError({ ...current, clearAll: true })).toContain(
      'out of date',
    );
  });
  test('requires review when the rate changes', () => {
    expect(getStorageClearanceExecutionError({ ...current, currentRatePsw: 300 })).toContain(
      'rate changed',
    );
  });
  test('refuses financial overclearance', () => {
    expect(getStorageClearanceExecutionError({ ...current, outstandingPsw: 200 })).toContain(
      'exceed outstanding',
    );
  });
});
