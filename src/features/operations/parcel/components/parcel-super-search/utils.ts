import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
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

export function deliveredPrincipalPayers(parcel: {
  status: number;
  senderPaidPrincipalPsw?: number;
  receiverPaidPrincipalPsw?: number;
}) {
  if (
    parcel.status !== ParcelStatus.DELIVERED_BY_OFFICE &&
    parcel.status !== ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER &&
    parcel.status !== ParcelStatus.DELIVERED_AT_HOME
  ) {
    return null;
  }

  const payers: Array<'S' | 'R'> = [];
  if (Number(parcel.senderPaidPrincipalPsw ?? 0) > 0) payers.push('S');
  if (Number(parcel.receiverPaidPrincipalPsw ?? 0) > 0) payers.push('R');
  return payers;
}
