import { PaymentComponent, Payer, PaymentMethod } from '@/db/schemas/enums';
import type { PaymentRow } from '../payments/repository';

type ReceiptPayment = Pick<
  PaymentRow,
  | 'component'
  | 'payer'
  | 'grossAmountPsw'
  | 'vatPsw'
  | 'getfundPsw'
  | 'nhilPsw'
  | 'covidPsw'
  | 'taxTotalPsw'
> &
  Partial<Pick<PaymentRow, 'method' | 'voidedAt'>>;

export function summarizeSenderReceiptPayments(rows: ReceiptPayment[]) {
  const principal = rows.filter(
    (row) =>
      row.component === PaymentComponent.PRINCIPAL &&
      row.payer === Payer.SENDER &&
      row.method !== PaymentMethod.CREDIT &&
      !row.voidedAt,
  );
  if (!principal.length) return null;

  return sumRecordedReceiptPayments(principal);
}

export function buildSenderReceiptReprintTax(method: number, rows: ReceiptPayment[]) {
  const recorded = summarizeSenderReceiptPayments(rows);
  if (recorded && recorded.grossAmountPsw > 0) return recorded;
  if (method === PaymentMethod.CREDIT) {
    return { ...sumRecordedReceiptPayments([]), settlementMode: 'CREDIT' as const };
  }
  return null;
}

export function sumRecordedReceiptPayments(rows: ReceiptPayment[]) {
  const totals = rows.reduce(
    (sum, row) => ({
      grossAmountPsw: sum.grossAmountPsw + row.grossAmountPsw,
      vatPsw: sum.vatPsw + row.vatPsw,
      getfundPsw: sum.getfundPsw + row.getfundPsw,
      nhilPsw: sum.nhilPsw + row.nhilPsw,
      covidPsw: sum.covidPsw + row.covidPsw,
      taxTotalPsw: sum.taxTotalPsw + row.taxTotalPsw,
    }),
    { grossAmountPsw: 0, vatPsw: 0, getfundPsw: 0, nhilPsw: 0, covidPsw: 0, taxTotalPsw: 0 },
  );

  return {
    ...totals,
    taxComponentKeys: [
      totals.getfundPsw > 0 && 'GETFUND',
      totals.nhilPsw > 0 && 'NHIL',
      totals.vatPsw > 0 && 'VAT',
      totals.covidPsw > 0 && 'COVID',
    ].filter((key): key is string => Boolean(key)),
  };
}
