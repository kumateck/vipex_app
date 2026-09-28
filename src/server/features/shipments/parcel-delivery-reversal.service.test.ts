import { describe, expect, test } from 'bun:test';
import { Payer } from '@/db/schemas';
import { getRecipientPaymentIdsForDeliveryReversal } from './parcel-delivery-reversal.service';

describe('getRecipientPaymentIdsForDeliveryReversal', () => {
  test('selects only active recipient payments', () => {
    expect(
      getRecipientPaymentIdsForDeliveryReversal([
        { id: 'sender', payer: Payer.SENDER, voidedAt: null },
        { id: 'recipient', payer: Payer.RECIPIENT, voidedAt: null },
        { id: 'already-voided', payer: Payer.RECIPIENT, voidedAt: new Date() },
      ]),
    ).toEqual(['recipient']);
  });
});
