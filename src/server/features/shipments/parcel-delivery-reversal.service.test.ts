import { describe, expect, test } from 'bun:test';
import { Payer, PaymentComponent } from '@/db/schemas';
import {
  getRecipientPaymentIdsForDeliveryReversal,
  getRestoredToBePaidPsw,
} from './parcel-delivery-reversal.utils';

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

  test('only voids payments captured by this confirmation when a snapshot exists', () => {
    expect(
      getRecipientPaymentIdsForDeliveryReversal(
        [
          { id: 'earlier-recipient', payer: Payer.RECIPIENT, voidedAt: null },
          { id: 'confirmation', payer: Payer.RECIPIENT, voidedAt: null },
          { id: 'sender', payer: Payer.SENDER, voidedAt: null },
        ],
        {
          parcelStatus: 4,
          confirmedAt: null,
          confirmedBy: null,
          plannedToBePaidPsw: 4_000,
          paymentIds: ['confirmation'],
          creditChargeIds: [],
          pickupQueueId: null,
          handover: {
            secondReceiverId: null,
            secondReceiverNameSnapshot: null,
            cardId: null,
            cardNumber: null,
            secondCardId: null,
            secondCardNumber: null,
          },
          delivery: null,
        },
      ),
    ).toEqual(['confirmation']);
  });
});

describe('getRestoredToBePaidPsw', () => {
  test('restores the full balance when a recipient principal payment is voided', () => {
    expect(
      getRestoredToBePaidPsw(
        15_000,
        [
          {
            id: 'recipient',
            component: PaymentComponent.PRINCIPAL,
            grossAmountPsw: 15_000,
            voidedAt: null,
          },
        ],
        ['recipient'],
      ),
    ).toBe(15_000);
  });

  test('keeps sender principal paid and ignores delivery fees and earlier voids', () => {
    expect(
      getRestoredToBePaidPsw(
        15_000,
        [
          {
            id: 'sender',
            component: PaymentComponent.PRINCIPAL,
            grossAmountPsw: 10_000,
            voidedAt: null,
          },
          {
            id: 'recipient',
            component: PaymentComponent.PRINCIPAL,
            grossAmountPsw: 5_000,
            voidedAt: null,
          },
          {
            id: 'fee',
            component: PaymentComponent.DELIVERY_FEE,
            grossAmountPsw: 1_000,
            voidedAt: null,
          },
          {
            id: 'old',
            component: PaymentComponent.PRINCIPAL,
            grossAmountPsw: 2_000,
            voidedAt: new Date(),
          },
        ],
        ['recipient', 'fee'],
      ),
    ).toBe(5_000);
  });

  test('retains recipient payments made before delivery confirmation', () => {
    expect(
      getRestoredToBePaidPsw(
        10_000,
        [
          {
            id: 'earlier',
            component: PaymentComponent.PRINCIPAL,
            grossAmountPsw: 3_000,
            voidedAt: null,
          },
          {
            id: 'confirmation',
            component: PaymentComponent.PRINCIPAL,
            grossAmountPsw: 7_000,
            voidedAt: null,
          },
        ],
        ['confirmation'],
      ),
    ).toBe(7_000);
  });
});
