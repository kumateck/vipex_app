import { PaymentComponent } from '@/db/schemas/enums';

type PrincipalPayment = {
  component: number;
  grossAmountPsw: number;
  voidedAt?: string | Date | null;
};

export function getOutstandingPrincipalPsw(
  chargePsw: number | null | undefined,
  payments: PrincipalPayment[],
) {
  const paidPrincipalPsw = payments.reduce((sum, payment) => {
    if (payment.component !== PaymentComponent.PRINCIPAL || payment.voidedAt) return sum;
    return sum + Number(payment.grossAmountPsw ?? 0);
  }, 0);

  return Math.max(Number(chargePsw ?? 0) - paidPrincipalPsw, 0);
}
