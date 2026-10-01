import { PaymentComponent, Payer } from '@/db/schemas/enums';
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
>;

export function summarizeSenderReceiptPayments(rows: ReceiptPayment[]) {
  const principal = rows.filter(
    (row) => row.component === PaymentComponent.PRINCIPAL && row.payer === Payer.SENDER,
  );
  if (!principal.length) return null;

  const totals = principal.reduce(
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
