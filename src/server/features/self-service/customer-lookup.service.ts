import { BadRequest, NotFound, TooManyRequests } from '@/server/utils/http-error';
import { getCacheStore } from '@/server/services/cache';
import { getBranchRepo } from '@/server/features/branches/repository';
import {
  findCustomerNameByExactTelephoneRepo,
  getCustomerRepo,
} from '@/server/features/customers/repository';
import { BranchType } from '@/db/schemas/enums';
import { validateSelfServiceSessionSvc } from './session.service';

const LOOKUP_WINDOW_SECONDS = 60 * 60;
const LOOKUP_MAX_PER_IP = 60;
const PHONE_DIGITS = 10;

function normalizePhone(value: string): string {
  return value.trim().replace(/[()\-\s]/g, '');
}

export async function lookupSelfServiceCustomerByPhoneSvc(input: {
  branchId: string;
  phone: string;
  sessionToken: string;
  requestIp?: string | null;
}) {
  await validateSelfServiceSessionSvc({
    branchId: input.branchId,
    sessionToken: input.sessionToken,
  });
  const branch = await getBranchRepo(input.branchId);
  if (!branch || branch.isDeleted) throw NotFound('Branch not found');
  if (branch.type === BranchType.HEADOFFICE) {
    throw BadRequest('Self-service booking is not available for this branch');
  }

  const phone = normalizePhone(input.phone);
  if (phone.length !== PHONE_DIGITS) {
    throw BadRequest(`Enter a valid ${PHONE_DIGITS}-digit phone number`);
  }

  if (input.requestIp) {
    const cache = getCacheStore();
    const count = await cache.incr(
      `rl:self-service-lookup:ip:${input.requestIp}`,
      LOOKUP_WINDOW_SECONDS,
    );
    if (count > LOOKUP_MAX_PER_IP) {
      throw TooManyRequests('Too many lookups from this network. Please try again later.');
    }
  }

  const match = await findCustomerNameByExactTelephoneRepo({
    companyId: branch.companyId,
    telephone: phone,
  });

  return match
    ? { customerId: match.id, fullname: match.fullname, telephone2: match.telephone2 }
    : null;
}

// The public draft-submit endpoint accepts a client-supplied customerId "hint"
// from a prior lookup call, so completion can attach the exact matched
// customer instead of re-resolving by phone. Never trust it blindly - confirm
// it's a real, non-deleted customer in the same company whose phone actually
// matches what was submitted, otherwise silently drop it (treat as no match).
export async function validateSelfServiceCustomerHintSvc(input: {
  companyId: string;
  customerId?: string | null;
  phone: string;
}): Promise<string | null> {
  if (!input.customerId) return null;
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId || customer.isDeleted) return null;
  const phone = normalizePhone(input.phone);
  if (customer.telephone !== phone && customer.telephone2 !== phone) return null;
  return customer.id;
}
