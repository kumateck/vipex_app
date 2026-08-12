import { PaymentMethod, PaymentResponsibility } from '@mobile/constants/payment';

export type MobilePaymentResponsibility =
  | typeof PaymentResponsibility.SENDER
  | typeof PaymentResponsibility.RECIPIENT;

export function getInitialMobilePaymentResponsibility(
  paymentMode?: string,
): MobilePaymentResponsibility {
  return paymentMode === 'sender' ? PaymentResponsibility.SENDER : PaymentResponsibility.RECIPIENT;
}

export function buildMobileParcelPaymentPlan(
  responsibility: MobilePaymentResponsibility,
  chargeCedis: number,
) {
  return {
    method: PaymentMethod.CASH,
    plannedToBePaidCedis: responsibility === PaymentResponsibility.RECIPIENT ? chargeCedis : 0,
    senderPaymentCedis: 0,
    paymentResponsibility: responsibility,
  };
}
