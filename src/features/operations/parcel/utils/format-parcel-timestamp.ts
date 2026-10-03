import { formatDateTime } from '@/lib/dates';

export function formatParcelTimestamp(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : formatDateTime(date);
}
