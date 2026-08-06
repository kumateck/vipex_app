import { PaymentMethod } from '@/db/schemas/enums';
import type { PaymentMethodOption, PaymentTypeLegendItem } from './receiver-cashier-types';

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.MTN, label: 'MTN' },
  { value: PaymentMethod.TELECEL, label: 'Telecel' },
  { value: PaymentMethod.AIRTEL, label: 'Airtel' },
];

export const PAYMENT_TYPE_LEGEND: PaymentTypeLegendItem[] = [
  { label: 'Receiver Pay', dotClassName: 'bg-amber-500' },
  { label: 'Partial Pay', dotClassName: 'bg-sky-500' },
];
