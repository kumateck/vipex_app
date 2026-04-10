export const CALL_STATUSES = ['all', 'pending', 'ringing', 'active', 'ended', 'cancelled'] as const;

export const CALL_TYPES = ['audio', 'video'] as const;

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

export function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
