import { describe, expect, test } from 'bun:test';
import { PaymentMethod } from '@/db/schemas/enums';
import {
  verifyStickerPaymentRecord,
  type StickerPaymentRecord,
} from './parcel-sticker-payment.rules';

const base: StickerPaymentRecord = {
  bookingCode: 'B1',
  trackingCode: 'T1',
  chargePsw: 5000,
  plannedToBePaidPsw: 0,
  senderPaidPsw: 0,
  receiverPaidPsw: 0,
  creditPsw: 0,
  method: PaymentMethod.CASH,
};

describe('server verified sticker payment states', () => {
  test.each([
    [{ senderPaidPsw: 5000 }, 'PAID', 0],
    [{ senderPaidPsw: 2000, receiverPaidPsw: 3000, plannedToBePaidPsw: 3000 }, 'PAID', 0],
    [{ plannedToBePaidPsw: 5000 }, 'TO BE PAID', 50],
    [{ senderPaidPsw: 2000, plannedToBePaidPsw: 3000 }, 'TO BE PAID', 30],
    [{ senderPaidPsw: 2000, receiverPaidPsw: 1000, plannedToBePaidPsw: 3000 }, 'TO BE PAID', 20],
    // The payment service rewrites plannedToBePaidPsw to charge - all paid principal.
    [{ senderPaidPsw: 2000, receiverPaidPsw: 1000, plannedToBePaidPsw: 2000 }, 'TO BE PAID', 20],
    [{ receiverPaidPsw: 1000, plannedToBePaidPsw: 4000 }, 'TO BE PAID', 40],
    [{ senderPaidPsw: 2000, receiverPaidPsw: 3000, plannedToBePaidPsw: 0 }, 'PAID', 0],
    [{ method: PaymentMethod.CREDIT, creditPsw: 5000 }, 'CREDIT', 0],
  ] as const)('uses saved settlement %j', (changes, status, amountCedis) => {
    expect(verifyStickerPaymentRecord({ ...base, ...changes })).toEqual({
      bookingCode: 'B1',
      trackingCode: 'T1',
      status,
      amountCedis,
    });
  });
  test.each([
    {},
    { senderPaidPsw: 1000 },
    { plannedToBePaidPsw: 3000 },
    { method: PaymentMethod.CREDIT },
    { method: PaymentMethod.CREDIT, creditPsw: 4000 },
    { senderPaidPsw: 6000 },
    { chargePsw: 0 },
    { chargePsw: NaN },
    { plannedToBePaidPsw: 6000 },
    { senderPaidPsw: -1 },
    { senderPaidPsw: 1.5 },
  ])('blocks incomplete or inconsistent settlement %j', (changes) => {
    expect(() => verifyStickerPaymentRecord({ ...base, ...changes })).toThrow(
      'payment status is not confirmed',
    );
  });
});
