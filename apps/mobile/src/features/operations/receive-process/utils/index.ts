export function formatCedis(psw: number | null | undefined) {
  return `GH₵ ${((psw ?? 0) / 100).toFixed(2)}`;
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export const PHONE_DIGITS = 10;
export const normalizePhoneDigits = (value: string) => value.replace(/\D/g, '');
export const limitPhoneDigits = (value: string) =>
  normalizePhoneDigits(value).slice(0, PHONE_DIGITS);
