import type { Row } from 'postgres';
import { PaymentMethod } from '@/db/schemas/enums';
import type { PendingReceiverHandover } from '@/shared/shipments/pending-receiver-handover';

export function planUnpaidReceiverHandover(parcel: Row, payments: Row[]) {
  const pending = parcel.pending_receiver_handover as PendingReceiverHandover | null;
  const paymentIds = pending?.snapshot?.paymentIds ?? [];
  const active = payments.filter((payment) => !payment.voided_at);
  const candidates = active.filter((payment) => paymentIds.includes(String(payment.id)));
  const remaining = active.filter((payment) => !paymentIds.includes(String(payment.id)));
  const principalPsw = candidates
    .filter((payment) => payment.component === 0)
    .reduce((sum, payment) => sum + Number(payment.gross_amount_psw), 0);
  const storagePsw = candidates
    .filter((payment) => payment.component === 2)
    .reduce((sum, payment) => sum + Number(payment.gross_amount_psw), 0);
  const remainingPrincipalPsw = remaining
    .filter((payment) => payment.component === 0)
    .reduce((sum, payment) => sum + Number(payment.gross_amount_psw), 0);
  const restoredPsw = Number(parcel.charge_psw) - remainingPrincipalPsw;
  let restriction: string | null = null;
  if (
    !pending ||
    pending.paymentPlan ||
    parcel.status !== 5 ||
    parcel.confirmed_at ||
    parcel.is_deleted
  ) {
    restriction = 'An undelivered legacy pending Receiver Cashier handover is required.';
  } else if (
    pending.companyId !== parcel.company_id ||
    pending.branchId !== parcel.destination_id ||
    pending.receiverId !== parcel.receiver_id ||
    !pending.id ||
    pending.collectorId !==
      (pending.handoverTarget === 'second' ? parcel.second_receiver_id : parcel.receiver_id)
  ) {
    restriction = 'The pending handover no longer matches this parcel or collector.';
  } else if (
    !paymentIds.length ||
    new Set(paymentIds).size !== paymentIds.length ||
    candidates.length !== paymentIds.length ||
    candidates.some(
      (payment) =>
        payment.payer !== 1 ||
        payment.cashier_type !== 1 ||
        payment.method !== PaymentMethod.CASH ||
        payment.momo_transaction_id ||
        payment.branch_id !== pending.branchId ||
        payment.cashier_user_id !== pending.requestedBy ||
        !Number.isSafeInteger(Number(payment.gross_amount_psw)) ||
        Number(payment.gross_amount_psw) <= 0 ||
        !(
          payment.component === 0 ||
          (payment.component === 2 && String(payment.notes).startsWith('STORAGE_CHARGE'))
        ),
    )
  ) {
    restriction =
      'Only the exact original cash principal/storage payments can be recovered. Review electronic or changed records with Accounts.';
  } else if (
    parcel.method === 4 ||
    remaining.some(
      (payment) =>
        payment.payer === 1 ||
        Number(payment.gross_amount_psw) < 0 ||
        !Number.isSafeInteger(Number(payment.gross_amount_psw)),
    ) ||
    !Number.isSafeInteger(restoredPsw) ||
    restoredPsw < 0 ||
    restoredPsw !== principalPsw ||
    Number(parcel.planned_tobepaid_psw) !== 0 ||
    principalPsw + storagePsw <= 0
  ) {
    restriction = 'Payments or the parcel balance changed; Accounts must review before recovery.';
  }
  return {
    pending,
    paymentIds,
    candidates,
    remaining,
    principalPsw,
    storagePsw,
    restoredPsw,
    restriction,
  };
}
