import { PaymentMethod } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';

export const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

export function formatParcelDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export function paymentMethodLabel(method: number) {
  const label = PaymentMethod[method];
  return typeof label === 'string' ? label : String(method);
}
