import { formatDateTime } from '@/lib/dates';
import { PaymentMethod } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ParcelSearchRow } from '../../api/parcel.api';

export const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};
export const EMPTY_ROWS: ParcelSearchRow[] = [];

export function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

export function formatConsignmentLabel(serialForDay: number | null | undefined) {
  if (!serialForDay || serialForDay < 1) return '-';
  return `Consignment ${serialForDay}`;
}

export function paymentMethodLabel(method: number) {
  const label = PaymentMethod[method];
  return typeof label === 'string' ? label : String(method);
}

export function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}
