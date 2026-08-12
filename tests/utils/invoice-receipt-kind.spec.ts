import { describe, expect, test } from 'bun:test';
import { isToBePaidDeliveryReceipt } from '@/features/printing/components/templates/invoice-a5-template.utils';

describe('A5 invoice receipt classification', () => {
  test('uses the to-be-paid delivery receipt before receiver payment', () => {
    expect(
      isToBePaidDeliveryReceipt({
        amountPaidCedis: 0,
        receiverToPayCedis: 30,
        senderPaidCedis: 0,
      }),
    ).toBe(true);
  });

  test('uses the paid receipt after receiver cashier collection', () => {
    expect(
      isToBePaidDeliveryReceipt({
        amountPaidCedis: 30,
        receiverToPayCedis: 0,
        senderPaidCedis: 0,
      }),
    ).toBe(false);
  });

  test('uses the paid receipt when the sender made a payment', () => {
    expect(
      isToBePaidDeliveryReceipt({
        amountPaidCedis: 20,
        receiverToPayCedis: 10,
        senderPaidCedis: 20,
      }),
    ).toBe(false);
  });
});
