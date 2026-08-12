import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';

type ReceiptPaymentState = Pick<
  InvoiceA5TemplateProps,
  'amountPaidCedis' | 'receiverToPayCedis' | 'senderPaidCedis'
>;

export function isToBePaidDeliveryReceipt({
  amountPaidCedis,
  receiverToPayCedis,
  senderPaidCedis,
}: ReceiptPaymentState) {
  return senderPaidCedis <= 0 && amountPaidCedis <= 0 && receiverToPayCedis > 0;
}
