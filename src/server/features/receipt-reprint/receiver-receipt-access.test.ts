import { ParcelStatus } from '@/db/schemas/enums';
import { describe, expect, test } from 'bun:test';
import type { AuthUser } from '@/server/plugins/auth';
import {
  canReadReceiverReceiptReprint,
  isReceiverReceiptReprintEligible,
} from './receiver-receipt-access';

const user: AuthUser = {
  sub: 'cashier',
  email: 'cashier@example.com',
  companyId: 'company-a',
  branchId: 'destination-a',
};
const parcel = { companyId: 'company-a', destinationId: 'destination-a', isDeleted: false };

describe('receiver receipt reprint scope', () => {
  test('allows the destination cashier', () => {
    expect(canReadReceiverReceiptReprint(user, parcel)).toBe(true);
  });
  test('hides other companies, branches, deleted parcels, and unscoped users', () => {
    expect(canReadReceiverReceiptReprint(user, { ...parcel, companyId: 'company-b' })).toBe(false);
    expect(canReadReceiverReceiptReprint(user, { ...parcel, destinationId: 'destination-b' })).toBe(
      false,
    );
    expect(canReadReceiverReceiptReprint(user, { ...parcel, isDeleted: true })).toBe(false);
    expect(canReadReceiverReceiptReprint({ ...user, companyId: null }, parcel)).toBe(false);
    expect(canReadReceiverReceiptReprint({ ...user, branchId: null }, parcel)).toBe(false);
  });
});

test('only confirmed office deliveries can reprint receiver receipts', () => {
  const confirmedAt = new Date('2026-10-01T12:00:00Z');
  expect(
    isReceiverReceiptReprintEligible({ status: ParcelStatus.DELIVERED_BY_OFFICE, confirmedAt }),
  ).toBe(true);
  expect(
    isReceiverReceiptReprintEligible({
      status: ParcelStatus.DELIVERED_BY_OFFICE,
      confirmedAt: null,
    }),
  ).toBe(false);
  for (const status of [
    ParcelStatus.AWAITING_PICKUP,
    ParcelStatus.DELIVERED_AT_HOME,
    ParcelStatus.IN_TRANSIT,
  ]) {
    expect(isReceiverReceiptReprintEligible({ status, confirmedAt })).toBe(false);
  }
});
