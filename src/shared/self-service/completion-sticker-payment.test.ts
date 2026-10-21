import { describe, expect, test } from 'bun:test';
import { getSelfServiceStickerPayment } from './index';

describe('self-service sticker payment state', () => {
  test.each([
    ['SENDER', 'PAY_NOW', null, 0],
    ['SENDER', 'CREDIT', null, 0],
    ['RECEIVER', 'PAY_NOW', null, 50],
    ['SPLIT', 'PAY_NOW', '20', 30],
    ['SPLIT', 'PAY_NOW', '50', 0],
  ] as const)('%s/%s with contribution %s', (responsibility, settlement, partial, due) => {
    expect(
      getSelfServiceStickerPayment({
        chargeCedis: '50',
        paymentResponsibility: responsibility,
        senderSettlementMode: settlement,
        senderPartialPaymentCedis: partial,
      }),
    ).toEqual({ receiverToPayCedis: due });
  });
});
