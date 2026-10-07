export function formatRiderReturnDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—';
}
