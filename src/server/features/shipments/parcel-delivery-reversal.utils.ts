import { PaymentComponent, Payer } from '@/db/schemas';
import type { DeliveryConfirmationSnapshot } from '@/shared/shipments/delivery-confirmation-snapshot';

export function getRecipientPaymentIdsForDeliveryReversal(
  payments: Array<{ id: string; payer: number; voidedAt: Date | null }>,
  snapshot?: DeliveryConfirmationSnapshot | null,
) {
  const confirmationPaymentIds = snapshot ? new Set(snapshot.paymentIds) : null;
  return payments
    .filter(
      (payment) =>
        payment.payer === Payer.RECIPIENT &&
        !payment.voidedAt &&
        (!confirmationPaymentIds || confirmationPaymentIds.has(payment.id)),
    )
    .map((payment) => payment.id);
}

export function getRestoredToBePaidPsw(
  chargePsw: number,
  payments: Array<{
    id: string;
    component: number;
    grossAmountPsw: number;
    voidedAt: Date | null;
  }>,
  voidedPaymentIds: readonly string[],
) {
  const voidedIds = new Set(voidedPaymentIds);
  const paidPrincipalPsw = payments.reduce(
    (total, payment) =>
      payment.component === PaymentComponent.PRINCIPAL &&
      !payment.voidedAt &&
      !voidedIds.has(payment.id)
        ? total + payment.grossAmountPsw
        : total,
    0,
  );
  return Math.max(chargePsw - paidPrincipalPsw, 0);
}
