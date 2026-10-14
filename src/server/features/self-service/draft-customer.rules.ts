import { BadRequest } from '@/server/utils/http-error';

export type DraftContactInput = { fullname: string; phone: string; phone2?: string | null };
export function normalizeDraftContact(input: DraftContactInput) {
  const fullname = input.fullname.trim();
  const normalizePhone = (value: string) => value.trim().replace(/[()\-\s]/g, '');
  const phone = normalizePhone(input.phone);
  const phone2 = input.phone2 ? normalizePhone(input.phone2) || null : null;
  if (!fullname || fullname.length > 255)
    throw BadRequest('Enter a customer name of 1 to 255 characters');
  if (!/^\d{10}$/.test(phone) || (phone2 && !/^\d{10}$/.test(phone2)))
    throw BadRequest('Customer phone numbers must contain exactly 10 digits');
  return { fullname, phone, phone2 };
}
