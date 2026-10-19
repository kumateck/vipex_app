import { describe, expect, test } from 'bun:test';
import { getSelfServiceStickerPayment } from './index';

describe('self-service sticker payment state', () => {
  test.each([
    ['SENDER', 'PAY_NOW', null, 0, 'PENDING'],
    ['SENDER', 'CREDIT', null, 0, 'CREDIT'],
    ['RECEIVER', 'PAY_NOW', null, 50, 'PENDING'],
    ['SPLIT', 'PAY_NOW', '20', 30, 'PENDING'],
    ['SPLIT', 'PAY_NOW', '50', 0, 'PENDING'],
  ] as const)('%s/%s with contribution %s', (responsibility, settlement, partial, due, label) => {
    expect(
      getSelfServiceStickerPayment({
        chargeCedis: '50',
        paymentResponsibility: responsibility,
        senderSettlementMode: settlement,
        senderPartialPaymentCedis: partial,
      }),
    ).toEqual({ receiverToPayCedis: due, statusLabel: label });
  });
});
