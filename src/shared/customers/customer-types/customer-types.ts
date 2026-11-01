/** Values preserve the existing Individual/Business API contract. */
export const CUSTOMER_TYPE_OPTIONS = [
  { value: 0, label: 'Individual' },
  { value: 1, label: 'Business' },
  { value: 2, label: 'Family' },
  { value: 3, label: 'Friends' },
  { value: 4, label: 'Director' },
  { value: 5, label: 'Staff' },
] as const;

export function customerTypeLabel(value: number) {
  return CUSTOMER_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? 'Unknown';
}

export function isChargeExemptCustomerType(value: number | null | undefined): boolean {
  return value === 2 || value === 3 || value === 4 || value === 5;
}

/** Either party qualifies. Staff takes precedence so receiving staff is always required. */
export function resolveParcelExemptionType(senderType?: number, receiverType?: number) {
  if (senderType === 5 || receiverType === 5) return 5;
  if (isChargeExemptCustomerType(receiverType)) return receiverType!;
  return isChargeExemptCustomerType(senderType) ? senderType! : null;
}
