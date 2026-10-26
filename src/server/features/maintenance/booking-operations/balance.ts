import { Conflict } from '@/server/utils/http-error';
import type { TaggedTransaction } from '../credit-repair';
import {
  bookingRepairResult,
  getBookingParcel,
  getParcelPayments,
  money,
  writeBookingRepairAudit,
  type BookingOperation,
} from './context';

const OPEN_STATES = new Set([0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 15, 16, 20]);
export async function getReversalEvidence(
  tx: TaggedTransaction,
  companyId: string,
  parcelId: string,
) {
  return tx`select id, created_at from (
    select id, created_at from audit_logs where company_id = ${companyId}
      and entity_type = 'parcel' and entity_id = ${parcelId} and action = 'PARCEL_DELIVERY_REVERSED'
    union all
    select id, voided_at as created_at from payments where company_id = ${companyId}
      and parcel_id = ${parcelId} and payer = 1 and voided_at is not null
      and void_reason like 'Delivery confirmation reversed:%'
  ) evidence order by created_at desc, id desc limit 1`;
}
export async function repairBookingBalance(
  tx: TaggedTransaction,
  input: BookingOperation,
  reversalOnly = false,
) {
  const parcel = await getBookingParcel(tx, input);
  const payments = await getParcelPayments(tx, input, String(parcel.id));
  const evidence = reversalOnly
    ? await getReversalEvidence(tx, input.companyId, String(parcel.id))
    : [];
  const activePrincipal = payments.filter((row) => !row.voided_at && row.component === 0);
  const paidPsw = activePrincipal.reduce((sum, row) => sum + Number(row.gross_amount_psw), 0);
  const chargePsw = Number(parcel.charge_psw);
  const expectedPsw = Math.max(chargePsw - paidPsw, 0);
  const previousPsw = Number(parcel.planned_tobepaid_psw);
  const restriction =
    parcel.method === 4
      ? 'Credit parcels must be reconciled through the credit ledger.'
      : !OPEN_STATES.has(Number(parcel.status))
        ? 'A delivered, cancelled or disposed parcel cannot be repaired here.'
        : reversalOnly && (![5, 10].includes(Number(parcel.status)) || !evidence.length)
          ? 'This repair requires a reversed delivery state and delivery-reversal evidence.'
          : reversalOnly && expectedPsw <= 0
            ? 'No unpaid principal remains. Review recipient payments before restoring a balance.'
            : !Number.isSafeInteger(chargePsw) ||
                chargePsw <= 0 ||
                !Number.isSafeInteger(paidPsw) ||
                paidPsw < 0 ||
                paidPsw > chargePsw ||
                activePrincipal.some((row) => Number(row.gross_amount_psw) <= 0 || row.method === 4)
              ? 'The charge or active principal payments are inconsistent. Accounts must review them.'
              : null;
  const details = {
    parcelId: parcel.id,
    bookingCode: parcel.booking_code,
    trackingCode: parcel.tracking_code,
    status: parcel.status,
    method: parcel.method,
    chargePsw,
    previousPsw,
    restoredPsw: expectedPsw,
    activePrincipalPayments: activePrincipal,
    reversalEvidence: evidence,
  };
  const result = bookingRepairResult(
    details,
    restriction,
    previousPsw !== expectedPsw,
    input.apply,
    previousPsw === expectedPsw
      ? 'The To Be Paid balance is already correct.'
      : `${input.apply ? 'Restored' : 'Ready to restore'} To Be Paid from ${money(previousPsw)} to ${money(expectedPsw)}. Payments are retained.`,
  );
  if (input.apply) {
    const updated =
      await tx`update parcels set planned_tobepaid_psw = ${expectedPsw}, updated_at = now()
      where id = ${parcel.id} and company_id = ${input.companyId} returning planned_tobepaid_psw`;
    if (updated.length !== 1 || Number(updated[0]!.planned_tobepaid_psw) !== expectedPsw)
      throw Conflict('The parcel changed during repair. Run a new preview.');
    await writeBookingRepairAudit(
      tx,
      input,
      String(parcel.id),
      reversalOnly ? 'PARCEL_TO_BE_PAID_BALANCE_REPAIRED' : 'PARCEL_FINANCIAL_STATE_REPAIRED',
      details,
    );
  }
  return result;
}
