import { BadRequest, Conflict, NotFound, TooManyRequests } from '@/server/utils/http-error';
import { getCacheStore } from '@/server/services/cache';
import { toPesewas } from '@/server/utils/gh-money';
import { getBranchRepo } from '@/server/features/branches/repository';
import { BranchType, SelfServiceDraftStatus } from '@/db/schemas/enums';
import { createSelfServiceDraftRepo } from './drafts.repository';
import { validateSelfServiceCustomerHintSvc } from './customer-lookup.service';
import { validateSelfServiceDestinationSvc } from './destination.service';
import { consumeSelfServiceSessionSvc, validateSelfServiceSessionSvc } from './session.service';

const DRAFT_TTL_MS = 60 * 60 * 1000; // 1 hour: unclaimed/incomplete drafts are hard-deleted after this
const PHONE_DIGITS = 10;

function normalizePhone(value: string): string {
  return value.trim().replace(/[()\-\s]/g, '');
}

async function rateLimitPublicSubmission(phone: string, ip: string | null) {
  const cache = getCacheStore();
  const phoneCount = await cache.incr(`rl:self-service-draft:phone:${phone}`, 24 * 60 * 60);
  if (phoneCount > 5) {
    throw TooManyRequests(
      'Too many self-service submissions from this phone today. Please try again later.',
    );
  }
  if (ip) {
    const ipCount = await cache.incr(`rl:self-service-draft:ip:${ip}`, 24 * 60 * 60);
    if (ipCount > 20) {
      throw TooManyRequests(
        'Too many self-service submissions from this network today. Please try again later.',
      );
    }
  }
}

export async function getSelfServiceBranchInfoSvc(input: {
  branchId: string;
  sessionToken: string;
}) {
  await validateSelfServiceSessionSvc(input);
  const branch = await getBranchRepo(input.branchId);
  if (!branch || branch.isDeleted) throw NotFound('Branch not found');
  if (branch.type === BranchType.HEADOFFICE) {
    throw BadRequest('Self-service booking is not available for this branch');
  }
  return { branchId: branch.id, branchName: branch.name };
}

export async function submitSelfServiceDraftSvc(input: {
  branchId: string;
  sender: { fullname: string; phone: string; phone2?: string | null; customerId?: string | null };
  receiver: {
    fullname: string;
    phone: string;
    phone2?: string | null;
    customerId?: string | null;
  };
  destinationBranchId: string;
  destinationLocationId?: string | null;
  parcelContent: string;
  parcelValueCedis: number | string;
  callSender: boolean;
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

  const senderFullname = input.sender.fullname.trim();
  const senderPhone = normalizePhone(input.sender.phone);
  const senderPhone2 = input.sender.phone2 ? normalizePhone(input.sender.phone2) : null;
  const receiverFullname = input.receiver.fullname.trim();
  const receiverPhone = normalizePhone(input.receiver.phone);
  const receiverPhone2 = input.receiver.phone2 ? normalizePhone(input.receiver.phone2) : null;
  const parcelContent = input.parcelContent.trim();

  if (!senderFullname || senderPhone.length !== PHONE_DIGITS) {
    throw BadRequest(`A valid sender name and ${PHONE_DIGITS}-digit phone number are required`);
  }
  if (!receiverFullname || receiverPhone.length !== PHONE_DIGITS) {
    throw BadRequest(`A valid receiver name and ${PHONE_DIGITS}-digit phone number are required`);
  }
  if (senderPhone2 && senderPhone2.length !== PHONE_DIGITS) {
    throw BadRequest(`Sender alternate phone must be ${PHONE_DIGITS} digits`);
  }
  if (receiverPhone2 && receiverPhone2.length !== PHONE_DIGITS) {
    throw BadRequest(`Receiver alternate phone must be ${PHONE_DIGITS} digits`);
  }
  if (!parcelContent) {
    throw BadRequest('Parcel content is required');
  }

  const parcelValuePsw = Number(toPesewas(input.parcelValueCedis ?? 0));
  if (!Number.isFinite(parcelValuePsw) || parcelValuePsw < 0) {
    throw BadRequest('Enter a valid parcel value');
  }

  await rateLimitPublicSubmission(senderPhone, input.requestIp ?? null);

  const [senderCustomerId, receiverCustomerId, destination] = await Promise.all([
    validateSelfServiceCustomerHintSvc({
      companyId: branch.companyId,
      customerId: input.sender.customerId,
      phone: senderPhone,
    }),
    validateSelfServiceCustomerHintSvc({
      companyId: branch.companyId,
      customerId: input.receiver.customerId,
      phone: receiverPhone,
    }),
    validateSelfServiceDestinationSvc({
      sourceBranchId: branch.id,
      companyId: branch.companyId,
      destinationBranchId: input.destinationBranchId,
      destinationLocationId: input.destinationLocationId,
    }),
  ]);

  await consumeSelfServiceSessionSvc({
    branchId: branch.id,
    sessionToken: input.sessionToken,
  });

  const now = Date.now();
  const created = await createSelfServiceDraftRepo({
    companyId: branch.companyId,
    branchId: branch.id,
    status: SelfServiceDraftStatus.PENDING,
    senderFullname,
    senderPhone,
    senderPhone2,
    senderCustomerId,
    receiverFullname,
    receiverPhone,
    receiverPhone2,
    receiverCustomerId,
    destinationBranchId: destination.destinationBranchId,
    destinationLocationId: destination.destinationLocationId,
    parcelContent,
    parcelValuePsw,
    callSender: Boolean(input.callSender),
    expiresAt: new Date(now + DRAFT_TTL_MS),
    requestIp: input.requestIp ?? null,
  });
  if (!created) throw Conflict('Unable to submit your booking right now. Please retry.');

  return { draftId: created.id, expiresAt: created.expiresAt.toISOString() };
}
