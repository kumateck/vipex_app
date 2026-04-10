import { formatDateTime } from '@/lib/date';

export function formatDiscrepancyDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export function discrepancyTypeLabel(type: string | null | undefined) {
  return type === 'record_not_physical' ? 'Record Not Physical' : 'Physical Missing';
}
