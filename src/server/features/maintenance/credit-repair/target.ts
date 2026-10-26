import type postgres from 'postgres';
import { REPAIR_MARKER, type RepairOptions } from './types';

export type TaggedTransaction = postgres.TransactionSql & {
  (
    template: TemplateStringsArray,
    ...values: postgres.ParameterOrFragment<never>[]
  ): postgres.PendingQuery<postgres.Row[]>;
};

export async function resolveRepairTarget(tx: TaggedTransaction, options: RepairOptions) {
  const { code, apply } = options;
  const scope = options.companyId ?? null;
  const parcelRows = apply
    ? await tx`
    select * from parcels where booking_code = ${code}
      and (${scope}::text is null or company_id = ${scope}) limit 2 for update
  `
    : await tx`
    select * from parcels where booking_code = ${code}
      and (${scope}::text is null or company_id = ${scope}) limit 2
  `;
  if (parcelRows.length === 0) throw new Error('No parcel found for this booking code');
  if (parcelRows.length !== 1)
    throw new Error('Booking code is ambiguous; specify --company or use Accounts reconciliation');
  const parcel = parcelRows[0]!;
  const companyId = String(parcel.company_id);
  const expectedPsw = Number(parcel.charge_psw);
  if (
    parcel.method !== 4 ||
    parcel.is_deleted ||
    !Number.isSafeInteger(expectedPsw) ||
    expectedPsw <= 0 ||
    Number(parcel.planned_tobepaid_psw) !== 0 ||
    (options.expectedPsw !== undefined && options.expectedPsw !== expectedPsw)
  ) {
    throw new Error('Parcel no longer matches the reviewed full-credit case');
  }
  const paymentRows = apply
    ? await tx`
    select * from payments where parcel_id = ${parcel.id} and company_id = ${companyId} for update
  `
    : await tx`select * from payments where parcel_id = ${parcel.id} and company_id = ${companyId}`;
  const activePrincipal = paymentRows.filter((row) => row.component === 0 && !row.voided_at);
  if (activePrincipal.length > 1)
    throw new Error('Multiple active principal payments require manual reconciliation');
  const repaired = paymentRows.filter(
    (row) =>
      row.component === 0 && row.voided_at && String(row.void_reason).startsWith(REPAIR_MARKER),
  );
  const payment = options.paymentId
    ? paymentRows.find((row) => row.id === options.paymentId)
    : (activePrincipal[0] ?? (repaired.length === 1 ? repaired[0] : undefined));
  if (
    !payment ||
    payment.component !== 0 ||
    payment.payer !== 0 ||
    payment.method !== 0 ||
    payment.momo_transaction_id ||
    Number(payment.gross_amount_psw) !== expectedPsw
  ) {
    throw new Error(
      'No single matching erroneous cash principal payment found; use Accounts reconciliation',
    );
  }
  if (
    payment.voided_at &&
    (!String(payment.void_reason).startsWith(REPAIR_MARKER) || activePrincipal.length !== 0)
  ) {
    throw new Error(
      'Payment was voided by another operation or another principal payment is active',
    );
  }
  return {
    parcel,
    payment,
    companyId,
    paymentId: String(payment.id),
    expectedPsw,
    alreadyRepaired: Boolean(payment.voided_at),
  };
}
