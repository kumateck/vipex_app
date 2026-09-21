import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '../../src/db/schemas/enums';
import { computeStorageAccrualPsw } from '../../src/server/features/shipments/parcels.service';

const policy = {
  agedThresholdMonths: 6,
  gracePeriodDays: 14,
  storageFeePerDayPsw: 200,
};

describe('parcel storage accrual', () => {
  test('charges full days after the grace period from the effective received time', () => {
    expect(
      computeStorageAccrualPsw({
        status: ParcelStatus.AWAITING_PICKUP,
        receivedAt: new Date('2026-06-09T20:30:20.794Z'),
        policy,
        now: new Date('2026-09-20T23:52:00.000Z'),
      }),
    ).toBe(17_800);
  });

  test('does not accrue without a received time or collection status', () => {
    expect(
      computeStorageAccrualPsw({
        status: ParcelStatus.AWAITING_PICKUP,
        receivedAt: null,
        policy,
        now: new Date('2026-09-20T23:52:00.000Z'),
      }),
    ).toBe(0);
    expect(
      computeStorageAccrualPsw({
        status: ParcelStatus.IN_TRANSIT,
        receivedAt: new Date('2026-06-09T20:30:20.794Z'),
        policy,
        now: new Date('2026-09-20T23:52:00.000Z'),
      }),
    ).toBe(0);
  });
});
