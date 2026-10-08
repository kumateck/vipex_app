import { describe, expect, test } from 'bun:test';
import { PaymentComponent, Payer } from '@/db/schemas/enums';
import { summarizeReceiverReceiptPayments } from './receiver-receipt-payments';

const payment = {
  component: PaymentComponent.PRINCIPAL,
  payer: Payer.RECIPIENT,
  grossAmountPsw: 3000,
  vatPsw: 250,
  getfundPsw: 50,
  nhilPsw: 50,
  covidPsw: 0,
  taxTotalPsw: 350,
  notes: null,
  voidedAt: null,
};

describe('delivered receiver receipt amounts', () => {
  test('uses recorded receiver principal and storage, excluding fees and voids', () => {
    expect(
      summarizeReceiverReceiptPayments([
        payment,
        {
          ...payment,
          component: PaymentComponent.OTHER,
          notes: 'STORAGE_CHARGE: storage',
          grossAmountPsw: 600,
          vatPsw: 0,
          getfundPsw: 0,
          nhilPsw: 0,
          taxTotalPsw: 0,
        },
        { ...payment, payer: Payer.SENDER, grossAmountPsw: 1000 },
        { ...payment, component: PaymentComponent.DELIVERY_FEE },
        { ...payment, component: PaymentComponent.OTHER, notes: 'Unrelated charge' },
        { ...payment, voidedAt: new Date() },
      ]),
    ).toEqual({
      grossAmountPsw: 3600,
      receiverPrincipalPsw: 3000,
      storageChargePsw: 600,
      senderPaidPsw: 1000,
      vatPsw: 250,
      getfundPsw: 50,
      nhilPsw: 50,
      covidPsw: 0,
      taxTotalPsw: 350,
      taxComponentKeys: ['GETFUND', 'NHIL', 'VAT'],
    });
  });
  test('supports storage-only collection on a sender-paid parcel', () => {
    const result = summarizeReceiverReceiptPayments([
      {
        ...payment,
        component: PaymentComponent.OTHER,
        notes: 'STORAGE_CHARGE: storage',
        grossAmountPsw: 600,
        vatPsw: 0,
        getfundPsw: 0,
        nhilPsw: 0,
        taxTotalPsw: 0,
      },
    ]);
    expect(result?.receiverPrincipalPsw).toBe(0);
    expect(result?.grossAmountPsw).toBe(600);
    expect(result?.taxComponentKeys).toEqual([]);
  });
  test('rejects missing or fully voided receiver payments', () => {
    expect(summarizeReceiverReceiptPayments([])).toBeNull();
    expect(summarizeReceiverReceiptPayments([{ ...payment, voidedAt: new Date() }])).toBeNull();
    expect(summarizeReceiverReceiptPayments([{ ...payment, payer: Payer.SENDER }])).toBeNull();
  });
});
