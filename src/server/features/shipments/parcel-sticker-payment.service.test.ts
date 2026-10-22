import { describe, expect, test } from 'bun:test';
import { BranchType, ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import {
  canVerifyStickerPayment,
  getVerifiedStickerPayment,
} from './parcel-sticker-payment.service';

const input = { bookingCode: 'B1', trackingCode: 'T1' };
const user: AuthUser = {
  sub: 'staff',
  email: 'staff@example.test',
  companyId: 'company',
  branchId: 'source',
};
const record = {
  ...input,
  companyId: 'company',
  sourceId: 'source',
  destinationId: 'destination',
  status: ParcelStatus.PROCESSED,
  chargePsw: 5000,
  plannedToBePaidPsw: 0,
  senderPaidPsw: 5000,
  receiverPaidPsw: 0,
  creditPsw: 0,
  method: PaymentMethod.CASH,
};
const moduleState = { companyId: 'company', moduleCode: 'sticker_print', isEnabled: true };

describe('sticker payment verification scope and freshness', () => {
  test('allows source, destination and head office in the same company', () => {
    for (const context of [
      user,
      { ...user, branchId: 'destination' },
      { ...user, branchId: 'hq', branchType: BranchType.HEADOFFICE },
    ]) {
      expect(canVerifyStickerPayment(context, record)).toBe(true);
    }
    expect(canVerifyStickerPayment({ ...user, companyId: 'other' }, record)).toBe(false);
    expect(canVerifyStickerPayment({ ...user, branchId: 'other' }, record)).toBe(false);
  });
  test('reads again for every attempt and blocks a subsequently voided payment', async () => {
    let calls = 0;
    const deps = {
      load: async () => ({ ...record, senderPaidPsw: calls++ === 0 ? 5000 : 0 }),
      ensureModule: async () => moduleState,
    };
    expect(await getVerifiedStickerPayment(input, user, deps)).toMatchObject({
      status: 'PAID',
      amountCedis: 0,
    });
    await expect(getVerifiedStickerPayment(input, user, deps)).rejects.toThrow(
      'payment status is not confirmed',
    );
    expect(calls).toBe(2);
  });
  test('reprints follow partial and full receiver settlement without another collection', async () => {
    let current = { ...record, senderPaidPsw: 2000, plannedToBePaidPsw: 3000 };
    const deps = { load: async () => current, ensureModule: async () => moduleState };
    expect(await getVerifiedStickerPayment(input, user, deps)).toMatchObject({
      status: 'TO BE PAID',
      amountCedis: 30,
    });
    current = { ...current, receiverPaidPsw: 1000, plannedToBePaidPsw: 2000 };
    expect(await getVerifiedStickerPayment(input, user, deps)).toMatchObject({
      status: 'TO BE PAID',
      amountCedis: 20,
    });
    current = { ...current, receiverPaidPsw: 3000, plannedToBePaidPsw: 0 };
    expect(await getVerifiedStickerPayment(input, user, deps)).toMatchObject({
      status: 'PAID',
      amountCedis: 0,
    });
  });
  test('a failed lookup or disabled module never falls back to the old label', async () => {
    await expect(
      getVerifiedStickerPayment(input, user, {
        load: async () => {
          throw new Error('Database unavailable');
        },
        ensureModule: async () => moduleState,
      }),
    ).rejects.toThrow('Database unavailable');
    await expect(
      getVerifiedStickerPayment(input, user, {
        load: async () => record,
        ensureModule: async () => {
          throw new Error('Module disabled');
        },
      }),
    ).rejects.toThrow('Module disabled');
  });
  test.each([
    null,
    { ...record, status: ParcelStatus.CANCELLED },
    { ...record, companyId: 'other' },
  ])('rejects missing, cancelled and out-of-scope parcels', async (candidate) => {
    await expect(
      getVerifiedStickerPayment(input, user, {
        load: async () => candidate,
        ensureModule: async () => moduleState,
      }),
    ).rejects.toThrow('Parcel not found');
  });
});
