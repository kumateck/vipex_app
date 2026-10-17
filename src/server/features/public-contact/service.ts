import { createHash } from 'node:crypto';
import { createId } from '@paralleldrive/cuid2';
import { BadRequest, ServiceUnavailable } from '@/server/utils/http-error';
import type { ContactRecord, PublicContactInput } from './schema';

export type PublicContactDependencies = {
  companyId: () => string | undefined;
  isEnabled: (companyId: string) => Promise<boolean>;
  save: (message: ContactRecord) => Promise<void>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const singleLine = (value = '') => value.trim().replace(/[\r\n\t]+/g, ' ');

export function createPublicContactService(deps: PublicContactDependencies) {
  return async (input: PublicContactInput): Promise<{ reference: string }> => {
    const name = singleLine(input.name);
    const phone = singleLine(input.phone);
    const email = singleLine(input.email);
    const message = input.message.trim();
    const digits = phone.replace(/\D/g, '');
    if (name.length < 2 || message.length < 10) throw BadRequest('Name and message are required');
    if (digits.length < 9 || digits.length > 13 || !/^[+\d\s().-]+$/.test(phone)) {
      throw BadRequest('Enter a valid contact phone number');
    }
    if (email && !EMAIL.test(email)) throw BadRequest('Enter a valid email address');
    // Direct API callers must pass the same spam check as the website.
    if (input.website?.trim()) throw BadRequest('Message could not be accepted');

    const companyId = deps.companyId()?.trim();
    if (!companyId || !(await deps.isEnabled(companyId))) {
      throw ServiceUnavailable('Website messages are temporarily unavailable. Please call VIPEX.');
    }
    // A retry of the same submission produces the same primary key, even across replicas.
    const id = input.submissionId
      ? createHash('sha256').update(`${companyId}:${input.submissionId}`).digest('hex').slice(0, 24)
      : createId();
    const reference = `WEB-${id.toUpperCase()}`;
    await deps.save({
      id,
      companyId,
      reference,
      type: input.type,
      name,
      phone,
      email: email || null,
      branch: singleLine(input.branch) || null,
      message,
      trackingCode: singleLine(input.trackingCode) || null,
    });
    return { reference };
  };
}
