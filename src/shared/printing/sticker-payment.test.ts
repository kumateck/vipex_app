import { describe, expect, test } from 'bun:test';
import {
  assertVerifiedStickerPayment,
  resolveStickerPayment,
  withVerifiedStickerPayment,
  type VerifiedStickerPayment,
} from './index';

describe('only known sticker payment states are printable', () => {
  test.each([
    [0, 'PAID'],
    [0, 'CREDIT'],
    [30, 'TO BE PAID'],
  ] as const)('%s / %s', (amount, status) => {
    expect(resolveStickerPayment(amount, status)).toEqual({
      hasToBePaid: status === 'TO BE PAID',
      statusLabel: status,
    });
  });
  test.each([undefined, null, 'PENDING', 'UNPAID', 'unknown'])(
    'blocks unknown status %s even with a positive amount',
    (status) => {
      expect(() => resolveStickerPayment(30, status)).toThrow('requires a verified');
    },
  );
  test.each([NaN, Infinity, -Infinity, -1, undefined])(
    'blocks invalid or missing amount %s',
    (amount) => {
      expect(() => resolveStickerPayment(amount, 'PAID')).toThrow();
    },
  );
  test.each([
    [0, 'TO BE PAID'],
    [30, 'PAID'],
    [30, 'CREDIT'],
  ] as const)('rejects inconsistent %s / %s', (amount, status) => {
    expect(() => resolveStickerPayment(amount, status)).toThrow('do not match');
  });
  test('rejects verification for another parcel', () => {
    const expected = { bookingCode: 'B1', trackingCode: 'T1' };
    const verified = { ...expected, status: 'PAID' as const, amountCedis: 0 };
    expect(assertVerifiedStickerPayment(verified, expected)).toEqual(verified);
    expect(() =>
      assertVerifiedStickerPayment({ ...verified, trackingCode: 'T2' }, expected),
    ).toThrow('does not match');
  });
  test('never invokes the print callback after missing, legacy, mismatched or failed verification', async () => {
    const expected = { bookingCode: 'B1', trackingCode: 'T1' };
    let printed = 0;
    const pending = {
      ...expected,
      status: 'PENDING',
      amountCedis: 0,
    } as unknown as VerifiedStickerPayment;
    for (const response of [
      pending,
      { ...pending, status: undefined },
      { ...pending, status: 'PAID', trackingCode: 'other' },
    ]) {
      await expect(
        withVerifiedStickerPayment(
          expected,
          async () => response as VerifiedStickerPayment,
          () => {
            printed++;
          },
        ),
      ).rejects.toThrow();
    }
    await expect(
      withVerifiedStickerPayment(
        expected,
        async () => {
          throw new Error('Network failed');
        },
        () => {
          printed++;
        },
      ),
    ).rejects.toThrow('Network failed');
    expect(printed).toBe(0);
  });
  test('a retry fetches again and prints only the newly verified receiver balance', async () => {
    const expected = { bookingCode: 'B1', trackingCode: 'T1' };
    let attempts = 0;
    const load = async (): Promise<VerifiedStickerPayment> => {
      if (++attempts === 1) throw new Error('Unpaid sender');
      return { ...expected, status: 'TO BE PAID', amountCedis: 30 };
    };
    const printed: VerifiedStickerPayment[] = [];
    const ready = (payment: VerifiedStickerPayment) => {
      printed.push(payment);
    };
    await expect(withVerifiedStickerPayment(expected, load, ready)).rejects.toThrow(
      'Unpaid sender',
    );
    await withVerifiedStickerPayment(expected, load, ready);
    expect(attempts).toBe(2);
    expect(printed).toEqual([{ ...expected, status: 'TO BE PAID', amountCedis: 30 }]);
  });
});
