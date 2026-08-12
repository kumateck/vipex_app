import { PaymentMethod } from '@/db/schemas/enums';

export type MtnPaymentFlow = 'automated' | 'manual';

export function isMtnPayment(value: string) {
  return value === String(PaymentMethod.MTN);
}

export function resolveMomoTransactionId(
  paymentMethod: string,
  flow: MtnPaymentFlow,
  transactionId: string,
) {
  return isMtnPayment(paymentMethod) && flow === 'automated' ? transactionId || null : null;
}
