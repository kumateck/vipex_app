export const PHONE_DIGITS = 10;

export function normalizePhoneDigits(value: string | null | undefined) {
  return String(value ?? '').replace(/\D/g, '');
}

export function limitPhoneDigits(value: string | null | undefined) {
  return normalizePhoneDigits(value).slice(0, PHONE_DIGITS);
}

export function isTenDigitPhone(value: string | null | undefined) {
  return normalizePhoneDigits(value).length === PHONE_DIGITS;
}

export function isOptionalTenDigitPhone(value: string | null | undefined) {
  const digits = normalizePhoneDigits(value);
  return digits.length === 0 || digits.length === PHONE_DIGITS;
}

export function phoneLengthMessage(label = 'Telephone') {
  return `${label} must be exactly ${PHONE_DIGITS} digits`;
}
