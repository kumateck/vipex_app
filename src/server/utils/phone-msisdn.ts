export const DEFAULT_COUNTRY_CODE = '233';

/**
 * Converts a stored phone number into the international digits-only form
 * WhatsApp expects (e.g. `0244123456` → `233244123456`).
 *
 * Accepts local numbers with a leading 0, numbers already carrying the
 * country code (with or without `+`/`00`), and common separators.
 * Returns null when the result cannot be a valid MSISDN.
 */
export function toMsisdn(
  phone: string | null | undefined,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (trimmed.startsWith('+')) {
    // Already international.
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = `${countryCode}${digits.slice(1)}`;
  } else if (!digits.startsWith(countryCode) && digits.length === 9) {
    // Local subscriber number entered without the trunk 0.
    digits = `${countryCode}${digits}`;
  }

  // E.164 allows at most 15 digits; anything under 10 cannot be a mobile.
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}
