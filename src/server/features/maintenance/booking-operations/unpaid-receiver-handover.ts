import { createHash } from 'node:crypto';
import { PaymentMethod } from '@/db/schemas/enums';
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
import { inspectPaymentVoid, excludeVoidedPaymentTax } from './payment-void';
import { planUnpaidReceiverHandover } from './unpaid-handover-plan';

export async function recoverUnpaidReceiverHandover(
  tx: TaggedTransaction,
  input: BookingOperation,
) {
  const parcel = await getBookingParcel(tx, input);
  const payments = await getParcelPayments(tx, input, String(parcel.id));
  const plan = planUnpaidReceiverHandover(parcel, payments);
  const tax = await inspectPaymentVoid(tx, input.companyId, plan.paymentIds, input.apply);
  const bankSettlements = plan.paymentIds.length
    ? await tx`select distinct settlement.id from reconciliation_bank_settlements settlement
      join payments pay on pay.company_id = settlement.company_id and pay.branch_id = settlement.branch_id
        and pay.received_at::date = settlement.settlement_date::date
      where pay.company_id = ${input.companyId} and pay.id = any(${plan.paymentIds}::text[])
        and settlement.status <> 2 order by settlement.id`
    : [];
  const restriction =
    plan.restriction ??
    tax.restriction ??
    (bankSettlements.length
      ? 'Saved bank settlements require Accounts reconciliation before recovery.'
      : null);
  const details = {
    parcelId: parcel.id,
    bookingCode: parcel.booking_code,
    handoverId: plan.pending?.id,
    originalCashierId: plan.pending?.requestedBy,
    signed: Boolean(plan.pending?.capture),
    pendingStateHash: createHash('sha256')
      .update(JSON.stringify(plan.pending ?? null))
      .digest('hex'),
    previousPsw: Number(parcel.planned_tobepaid_psw),
    restoredPsw: plan.restoredPsw,
    principalPsw: plan.principalPsw,
    storagePsw: plan.storagePsw,
    payments: plan.candidates.map((payment) => ({
      id: payment.id,
      cashierId: payment.cashier_user_id,
      amountPsw: Number(payment.gross_amount_psw),
      component: payment.component,
      method: payment.method,
      receivedAt: payment.received_at,
    })),
    retainedPaymentIds: plan.remaining.map((payment) => String(payment.id)),
    taxItems: tax.taxes,
    journals: tax.journals,
    cashConfirmations: tax.confirmations,
    bankSettlements,
  };
  const result = bookingRepairResult(
    details,
    restriction,
    Boolean(plan.pending && !plan.pending.paymentPlan),
    input.apply,
    `${input.apply ? 'Recovered' : 'Ready to recover'} ${money(plan.principalPsw + plan.storagePsw)} recorded without cash. Payment will belong to the cashier who confirms receipt.`,
  );
  if (!input.apply) return result;
  const reason =
    'UNPAID_RECEIVER_HANDOVER_RECOVERY: System Admin confirmed no cash was physically received';
  const voided =
    await tx`update payments set voided_at = now(), voided_by = ${input.actorId}, void_reason = ${reason}
    where company_id = ${input.companyId} and parcel_id = ${parcel.id}
      and id = any(${plan.paymentIds}::text[]) and voided_at is null returning id`;
  if (voided.length !== plan.paymentIds.length)
    throw Conflict('Payments changed. Run a fresh preview.');
  const excluded = await excludeVoidedPaymentTax(
    tx,
    input.companyId,
    input.actorId,
    plan.paymentIds,
    reason,
  );
  if (excluded !== tax.taxes.length) throw Conflict('Tax records changed. Run a fresh preview.');
  const pending = {
    ...plan.pending!,
    paymentPlan: {
      method: PaymentMethod.CASH,
      principalPsw: plan.principalPsw,
      storagePsw: plan.storagePsw,
      chargePsw: Number(parcel.charge_psw),
      existingPaymentIds: details.retainedPaymentIds,
      momoTransactionId: null,
    },
    snapshot: { ...plan.pending!.snapshot, paymentIds: [], plannedToBePaidPsw: plan.restoredPsw },
  };
  delete pending.snapshot.receiverCashierReceiptTax;
  await tx`update parcels set planned_tobepaid_psw = ${plan.restoredPsw},
    pending_receiver_handover = ${tx.typed(JSON.stringify(pending), 25)}::jsonb, updated_at = now()
    where id = ${parcel.id} and company_id = ${input.companyId}`;
  await writeBookingRepairAudit(
    tx,
    input,
    String(parcel.id),
    'UNPAID_RECEIVER_HANDOVER_RECOVERED',
    details,
  );
  return result;
}
