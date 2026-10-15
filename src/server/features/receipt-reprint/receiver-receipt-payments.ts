import { PaymentComponent, Payer } from '@/db/schemas/enums';
import type { PaymentRow } from '../payments/repository';
import { sumRecordedReceiptPayments } from './receipt-reprint-tax';

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
  | 'notes'
  | 'voidedAt'
>;

export function summarizeReceiverReceiptPayments(rows: ReceiptPayment[]) {
  const active = rows.filter((row) => !row.voidedAt);
  const principal = active.filter(
    (row) => row.payer === Payer.RECIPIENT && row.component === PaymentComponent.PRINCIPAL,
  );
  const storage = active.filter(
    (row) =>
      row.payer === Payer.RECIPIENT &&
      row.component === PaymentComponent.OTHER &&
      (row.notes ?? '').startsWith('STORAGE_CHARGE'),
  );
  const receiptPayments = [...principal, ...storage];
  if (!receiptPayments.length) return null;
  const tax = sumRecordedReceiptPayments(receiptPayments);
  return {
    ...tax,
    receiverPrincipalPsw: principal.reduce((sum, row) => sum + row.grossAmountPsw, 0),
    storageChargePsw: storage.reduce((sum, row) => sum + row.grossAmountPsw, 0),
    senderPaidPsw: active
      .filter((row) => row.payer === Payer.SENDER && row.component === PaymentComponent.PRINCIPAL)
      .reduce((sum, row) => sum + row.grossAmountPsw, 0),
  };
}
