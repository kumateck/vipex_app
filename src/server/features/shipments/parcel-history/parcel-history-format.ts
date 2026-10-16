import {
  ParcelDispositionActionType,
  ParcelReconciliationActionType,
  ParcelReconciliationCaseType,
  Payer,
  PaymentComponent,
  PaymentMethod,
} from '@/db/schemas/enums';

export function money(psw: number | null | undefined) {
  return `GHS ${(Number(psw ?? 0) / 100).toFixed(2)}`;
}

/** `PARCEL_FOO_BAR` / `fooBar` / `foo_bar` -> "Parcel foo bar" / "Foo bar". */
export function humanize(value: string) {
  const words = value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function joinParts(parts: Array<string | null | undefined | false>) {
  const text = parts.filter((part): part is string => Boolean(part && part.trim())).join(' • ');
  return text || null;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function enumLabel(enumObject: Record<string | number, string | number>, value: unknown) {
  const name = typeof value === 'number' ? enumObject[value] : undefined;
  return typeof name === 'string' ? humanize(name) : null;
}

export const paymentComponentLabel = (value: number) =>
  value === PaymentComponent.PRINCIPAL
    ? 'Parcel charge'
    : value === PaymentComponent.DELIVERY_FEE
      ? 'Delivery fee'
      : 'Other charge';

export const payerLabel = (value: number) =>
  value === Payer.SENDER ? 'paid by sender' : value === Payer.RECIPIENT ? 'paid by receiver' : null;

export const paymentMethodLabel = (value: number) => {
  const name = PaymentMethod[value];
  return typeof name === 'string' ? (name === 'CASH' ? 'Cash' : name) : null;
};

export const dispositionLabel = (value: number) => enumLabel(ParcelDispositionActionType, value);
export const caseTypeLabel = (value: number | null) =>
  enumLabel(ParcelReconciliationCaseType, value);
export const caseActionLabel = (value: number | null) =>
  enumLabel(ParcelReconciliationActionType, value);

/** Shows only the last four digits of a phone number. */
export function maskPhone(phone: string | null | undefined) {
  if (!phone) return null;
  return phone.length > 4 ? `•••${phone.slice(-4)}` : phone;
}
