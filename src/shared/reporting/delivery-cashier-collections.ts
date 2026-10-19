import { CashierType, PaymentComponent } from '../../db/schemas/enums';

type CollectionPayment = { cashierType?: number; component?: number; grossAmountPsw: number };

export function getDeliveryCashierCollections(transactions: readonly CollectionPayment[] = []) {
  let deliveryFeeReceivedPsw = 0;
  let toBePaidReceivedPsw = 0;
  let hasDeliveryPayments = false;
  for (const payment of transactions) {
    if (payment.cashierType !== CashierType.DELIVERY) continue;
    hasDeliveryPayments = true;
    if (payment.component === PaymentComponent.DELIVERY_FEE)
      deliveryFeeReceivedPsw += payment.grossAmountPsw;
    if (payment.component === PaymentComponent.PRINCIPAL)
      toBePaidReceivedPsw += payment.grossAmountPsw;
  }
  return { deliveryFeeReceivedPsw, toBePaidReceivedPsw, hasDeliveryPayments };
}
