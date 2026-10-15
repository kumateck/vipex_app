import type { SelfServiceContactInput } from '../types';

export type SelfServiceContactForm = { fullname: string; phone: string; phone2: string };

// Mirrors the server rule in draft-customer.rules.ts: 10 digits after removing
// spaces, dashes and brackets.
const normalizePhone = (value: string) => value.trim().replace(/[()\-\s]/g, '');
const isTenDigits = (value: string) => /^\d{10}$/.test(normalizePhone(value));

export function getSelfServiceContactError(contact: SelfServiceContactForm) {
  const fullname = contact.fullname.trim();
  if (!fullname || fullname.length > 255) return 'Enter a name';
  if (!isTenDigits(contact.phone)) return 'Phone must be 10 digits';
  if (contact.phone2.trim() && !isTenDigits(contact.phone2))
    return 'Backup phone must be 10 digits';
  return null;
}

export function toSelfServiceContactInput(
  contact: SelfServiceContactForm,
): SelfServiceContactInput {
  return {
    fullname: contact.fullname.trim(),
    phone: normalizePhone(contact.phone),
    phone2: normalizePhone(contact.phone2) || null,
  };
}

export function getSelfServiceParcelError(input: {
  destinationBranchId: string;
  parcelContent: string;
  parcelValue: string;
}) {
  if (!input.destinationBranchId) return 'Select a destination branch';
  if (!input.parcelContent.trim()) return 'Enter what is inside the parcel';
  const value = input.parcelValue.replace(/,/g, '').trim();
  if (!value || !Number.isFinite(Number(value)) || Number(value) < 0)
    return 'Enter a valid declared value';
  return null;
}
