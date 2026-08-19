import { PHONE_DIGITS, normalizePhoneDigits } from '@/lib/phone';

export type ExistingCustomerEditValues = {
  fullname: string;
  telephone2: string;
};

export function validateExistingCustomerEdit(
  values: ExistingCustomerEditValues,
  primaryTelephone: string,
) {
  const fullname = values.fullname.trim();
  const primaryPhone = normalizePhoneDigits(primaryTelephone);
  const secondaryPhone = normalizePhoneDigits(values.telephone2);

  if (!fullname) return 'Customer name is required';
  if (fullname.length > 255) return 'Customer name cannot exceed 255 characters';
  if (secondaryPhone && secondaryPhone.length !== PHONE_DIGITS) {
    return `Telephone 2 must be exactly ${PHONE_DIGITS} digits`;
  }
  if (secondaryPhone && secondaryPhone === primaryPhone) {
    return 'Primary and secondary telephone cannot be the same';
  }

  return null;
}
