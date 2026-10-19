const PHONE_DIGITS = 10;

export function normalizePhoneDigits(value: string | null | undefined) {
  return String(value ?? '').replace(/\D/g, '');
}

export function limitPhoneDigits(value: string | null | undefined) {
  return normalizePhoneDigits(value).slice(0, PHONE_DIGITS);
}

export function isTenDigitPhone(value: string | null | undefined) {
  return normalizePhoneDigits(value).length === PHONE_DIGITS;
}
