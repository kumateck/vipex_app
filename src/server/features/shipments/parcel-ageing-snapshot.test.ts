import { expect, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import { computeParcelAgeingSnapshot } from './parcels.service';

const policy = {
  storageFeePerDayPsw: 200,
  gracePeriodDays: 14,
  agedThresholdMonths: 6,
};

test('includes accrued storage fees for parcels moved to aged warehouse status', () => {
  const now = new Date('2026-10-08T00:00:00.000Z');
  const snapshot = computeParcelAgeingSnapshot({
    status: ParcelStatus.AGED_IN_WAREHOUSE,
    receivedAt: new Date('2026-09-18T00:00:00.000Z'),
    policy,
    now,
  });

  expect(snapshot.isParcelAgeingEligible).toBe(true);
  expect(snapshot.storageChargeDays).toBe(6);
  expect(snapshot.storageChargePsw).toBe(1200);
});

test('does not accrue storage fees for statuses outside collection', () => {
  const snapshot = computeParcelAgeingSnapshot({
    status: ParcelStatus.DELIVERED_BY_OFFICE,
    receivedAt: new Date('2026-09-01T00:00:00.000Z'),
    policy,
    now: new Date('2026-10-08T00:00:00.000Z'),
  });

  expect(snapshot.isParcelAgeingEligible).toBe(false);
  expect(snapshot.storageChargePsw).toBe(0);
});
