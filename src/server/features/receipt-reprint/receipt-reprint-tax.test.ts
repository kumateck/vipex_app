import { describe, expect, test } from 'bun:test';
import { PaymentComponent, Payer } from '@/db/schemas/enums';
import { summarizeSenderReceiptPayments } from './receipt-reprint-tax';

describe('sender receipt reprint tax', () => {
  test('sums recorded sender principal amounts, not other payment components', () => {
    const base = {
      component: PaymentComponent.PRINCIPAL,
      payer: Payer.SENDER,
      grossAmountPsw: 2_000,
      vatPsw: 250,
      getfundPsw: 50,
      nhilPsw: 50,
      covidPsw: 0,
      taxTotalPsw: 350,
    };
    expect(
      summarizeSenderReceiptPayments([
        base,
        { ...base, grossAmountPsw: 1_000, vatPsw: 125, taxTotalPsw: 225 },
        { ...base, component: PaymentComponent.DELIVERY_FEE, grossAmountPsw: 500 },
        { ...base, payer: Payer.RECIPIENT, grossAmountPsw: 1_000 },
      ]),
    ).toEqual({
      grossAmountPsw: 3_000,
      vatPsw: 375,
      getfundPsw: 100,
      nhilPsw: 100,
      covidPsw: 0,
      taxTotalPsw: 575,
      taxComponentKeys: ['GETFUND', 'NHIL', 'VAT'],
    });
  });

  test('returns null when no sender principal payment exists', () => {
    expect(summarizeSenderReceiptPayments([])).toBeNull();
  });
});
