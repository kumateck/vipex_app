import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import type { ParcelSearchRow } from '../../api/parcel.api';

export function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return sharedFormatDateTime(value);
}

export function getPaymentBucketLabel(row: Pick<ParcelSearchRow, 'plannedToBePaidPsw'>) {
  return row.plannedToBePaidPsw > 0 ? 'Receiver Pays' : 'Sender Paid';
}

export function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}
