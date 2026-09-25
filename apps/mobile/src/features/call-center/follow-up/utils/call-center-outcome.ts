export const PHONE_DIGITS = 10;

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '').slice(0, PHONE_DIGITS);
}

export function getDialUrl(value: string) {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/\D/g, '');
  return digits ? `tel:${prefix}${digits}` : null;
}

export function validateSecondReceiver(enabled: boolean, name: string, phone: string) {
  if (!enabled) return null;
  const fullname = name.trim();
  const telephone = normalizePhone(phone);
  if (!fullname || !telephone) return 'Second receiver name and telephone are required.';
  if (telephone.length !== PHONE_DIGITS) return 'Second receiver telephone must be 10 digits.';
  return null;
}

export function formatPsw(value: number) {
  return `GHS ${(value / 100).toFixed(2)}`;
}

export function formatReceivedAt(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
