import { Conflict } from '@/server/utils/http-error';
import type { TaggedTransaction } from '../credit-repair';
import { getReversalEvidence } from './balance';
import {
  bookingRepairResult,
  getBookingParcel,
  getParcelPayments,
  money,
  writeBookingRepairAudit,
  type BookingOperation,
} from './context';
import { inspectPaymentVoid, excludeVoidedPaymentTax } from './payment-void';

export async function repairReversedRecipientPayments(
  tx: TaggedTransaction,
  input: BookingOperation,
) {
  const parcel = await getBookingParcel(tx, input);
  const payments = await getParcelPayments(tx, input, String(parcel.id));
  const recipient = payments.filter((row) => !row.voided_at && row.payer === 1);
  const principal = recipient.filter((row) => row.component === 0);
  const evidence = await getReversalEvidence(tx, input.companyId, String(parcel.id));
  const senderPsw = payments
    .filter((row) => !row.voided_at && row.payer === 0 && row.component === 0)
    .reduce((sum, row) => sum + Number(row.gross_amount_psw), 0);
  const expectedPsw = Number(parcel.charge_psw) - senderPsw;
  const paymentIds = principal.map((row) => String(row.id));
  const tax = await inspectPaymentVoid(tx, input.companyId, paymentIds, input.apply);
  const evidenceTime = new Date(evidence[0]?.created_at as string).getTime();
  const restriction =
    parcel.method === 4
      ? 'Credit parcels require credit-ledger reconciliation.'
      : ![5, 10].includes(Number(parcel.status)) || !evidence.length
        ? 'A reversed delivery state and delivery-reversal evidence are required.'
        : recipient.length !== principal.length
          ? 'Recipient fee payments require Accounts review; this repair only voids principal.'
          : principal.some(
                (row) =>
                  row.method !== 0 ||
                  row.momo_transaction_id ||
                  Number(row.gross_amount_psw) <= 0 ||
                  new Date(row.received_at as string).getTime() > evidenceTime,
              )
            ? 'Only cash principal collected before the recorded reversal is supported. Review electronic or later payments with Accounts.'
            : payments.some(
                  (row) =>
                    !row.voided_at &&
                    row.component === 0 &&
                    (Number(row.gross_amount_psw) <= 0 ||
                      row.method === 4 ||
                      ![0, 1].includes(Number(row.payer))),
                ) ||
                senderPsw + principal.reduce((sum, row) => sum + Number(row.gross_amount_psw), 0) >
                  Number(parcel.charge_psw)
              ? 'Active principal payments are inconsistent. Accounts must review them.'
              : !Number.isSafeInteger(expectedPsw) || expectedPsw <= 0 || senderPsw < 0
                ? 'No consistent unpaid principal remains after retaining sender payments.'
                : tax.restriction;
  const details = {
    parcelId: parcel.id,
    bookingCode: parcel.booking_code,
    status: parcel.status,
    chargePsw: Number(parcel.charge_psw),
    previousPsw: Number(parcel.planned_tobepaid_psw),
    restoredPsw: expectedPsw,
    payments,
    reversalEvidence: evidence,
    taxItems: tax.taxes,
    journals: tax.journals,
    cashConfirmations: tax.confirmations,
  };
  const result = bookingRepairResult(
    details,
    restriction,
    paymentIds.length > 0,
    input.apply,
    paymentIds.length
      ? `${input.apply ? 'Voided' : 'Ready to void'} ${paymentIds.length} recipient principal payment(s) and restore To Be Paid to ${money(expectedPsw)}.`
      : 'No active recipient principal payment remains. Use the balance restoration if needed.',
  );
  if (input.apply) {
    const reason =
      'REVERSED_RECIPIENT_PAYMENT_REPAIR: System Admin confirmed recipient collections were reversed/refunded';
    const voided =
      await tx`update payments set voided_at = now(), voided_by = ${input.actorId}, void_reason = ${reason}
      where company_id = ${input.companyId} and parcel_id = ${parcel.id} and id = any(${paymentIds}::text[]) and voided_at is null returning id`;
    if (voided.length !== paymentIds.length)
      throw Conflict('Recipient payments changed during repair. Run a fresh preview.');
    const excluded = await excludeVoidedPaymentTax(
      tx,
      input.companyId,
      input.actorId,
      paymentIds,
      reason,
    );
    if (excluded !== tax.taxes.length)
      throw Conflict('Tax records changed during repair. Run a fresh preview.');
    const updated =
      await tx`update parcels set planned_tobepaid_psw = ${expectedPsw}, updated_at = now()
      where company_id = ${input.companyId} and id = ${parcel.id} returning planned_tobepaid_psw`;
    if (updated.length !== 1 || Number(updated[0]!.planned_tobepaid_psw) !== expectedPsw)
      throw Conflict('Parcel balance changed during repair. Run a fresh preview.');
    await writeBookingRepairAudit(
      tx,
      input,
      String(parcel.id),
      'REVERSED_RECIPIENT_PAYMENT_REPAIRED',
      details,
    );
  }
  return result;
}
