import { CashierType, PaymentMethod } from '@/db/schemas/enums';

export const CASHIER_TYPE_LABELS: Record<number, string> = {
  [CashierType.SENDING]: 'Sender Cashier',
  [CashierType.TOBEPAID]: 'Receiver Cashier',
  [CashierType.DELIVERY]: 'Delivery Cashier',
  [CashierType.FULL]: 'Full Cashier',
};

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.MTN]: 'MTN Mobile Money',
  [PaymentMethod.TELECEL]: 'Telecel Cash',
  [PaymentMethod.AIRTEL]: 'AirtelTigo Cash',
  [PaymentMethod.CREDIT]: 'Credit',
};
