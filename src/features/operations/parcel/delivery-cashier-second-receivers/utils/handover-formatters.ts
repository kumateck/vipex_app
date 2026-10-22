import { formatDateTime } from '@/lib/dates';

export function formatHandoverPhones(...phones: Array<string | null | undefined>) {
  return phones.filter((phone) => phone?.trim()).join(' / ') || '-';
}

export function formatHandoverDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : formatDateTime(date);
}

export function formatHandoverMoney(amountPsw: number | null | undefined) {
  return amountPsw == null ? '-' : `GHS ${(amountPsw / 100).toFixed(2)}`;
}
