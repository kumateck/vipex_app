import { createHash, randomBytes } from 'node:crypto';
import { BranchType } from '@/db/schemas/enums';
import { getBranchRepo } from '@/server/features/branches/repository';
import { getCacheStore } from '@/server/services/cache';
import { getSelfServiceSessionStore, type SelfServiceSessionStore } from './session-store';
import { BadRequest, Gone, NotFound, TooManyRequests } from '@/server/utils/http-error';

export const SELF_SERVICE_SESSION_TTL_SECONDS = 15 * 60;
export const SELF_SERVICE_BOOKINGS_PER_SCAN = 10;

const SESSION_KEY_PREFIX = 'self-service:session:';
const SESSION_ISSUE_LIMIT_PER_IP = 30;

export type SelfServiceSessionPayload = {
  branchId: string;
  bookingNumber: number;
  issuedAt: string;
  expiresAt: string;
};

function sessionKey(token: string): string {
  const digest = createHash('sha256').update(token).digest('hex');
  return `${SESSION_KEY_PREFIX}${digest}`;
}

function expiredSessionError() {
  return Gone('Your booking session is no longer available. Please start a new booking.', {
    reason: 'SELF_SERVICE_SESSION_EXPIRED',
  });
}

function parseSession(value: string | null): SelfServiceSessionPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<SelfServiceSessionPayload>;
    if (
      !parsed.branchId ||
      !parsed.issuedAt ||
      !parsed.expiresAt ||
      !Number.isFinite(Date.parse(parsed.issuedAt)) ||
      !Number.isFinite(Date.parse(parsed.expiresAt))
    )
      return null;
    const bookingNumber = parsed.bookingNumber ?? 1;
    if (
      !Number.isInteger(bookingNumber) ||
      bookingNumber < 1 ||
      bookingNumber > SELF_SERVICE_BOOKINGS_PER_SCAN
    )
      return null;
    return { ...parsed, bookingNumber } as SelfServiceSessionPayload;
  } catch {
    return null;
  }
}

async function readSession(
  token: string,
  consume: boolean,
  cache: SelfServiceSessionStore,
): Promise<SelfServiceSessionPayload> {
  if (!token || token.length > 256) throw expiredSessionError();
  const key = sessionKey(token);
  const session = parseSession(consume ? await cache.take(key) : await cache.get(key));
  if (!session || Date.parse(session.expiresAt) <= Date.now()) {
    if (!consume) await cache.del(key);
    throw expiredSessionError();
  }
  return session;
}

export async function createSelfServiceSessionToken(input: {
  branchId: string;
  cache?: SelfServiceSessionStore;
  previous?: SelfServiceSessionPayload;
  token?: string;
}) {
  const now = Date.now();
  const payload: SelfServiceSessionPayload = {
    branchId: input.branchId,
    bookingNumber: input.previous ? input.previous.bookingNumber + 1 : 1,
    issuedAt: input.previous?.issuedAt ?? new Date(now).toISOString(),
    expiresAt:
      input.previous?.expiresAt ??
      new Date(now + SELF_SERVICE_SESSION_TTL_SECONDS * 1000).toISOString(),
  };
  if (
    payload.bookingNumber > SELF_SERVICE_BOOKINGS_PER_SCAN ||
    Date.parse(payload.expiresAt) <= now
  )
    throw expiredSessionError();
  const sessionToken = input.token ?? randomBytes(32).toString('base64url');
  await (input.cache ?? getSelfServiceSessionStore()).set(
    sessionKey(sessionToken),
    JSON.stringify(payload),
    {
      ttlSeconds: SELF_SERVICE_SESSION_TTL_SECONDS,
    },
  );
  return { sessionToken, ...payload };
}

export async function issueSelfServiceSessionSvc(input: {
  branchId: string;
  requestIp?: string | null;
}) {
  const branch = await getBranchRepo(input.branchId);
  if (!branch || branch.isDeleted) throw NotFound('Branch not found');
  if (branch.type === BranchType.HEADOFFICE) {
    throw BadRequest('Self-service booking is not available for this branch');
  }

  const cache = getCacheStore();
  if (input.requestIp) {
    const count = await cache.incr(
      `rl:self-service-session:ip:${input.requestIp}`,
      SELF_SERVICE_SESSION_TTL_SECONDS,
    );
    if (count > SESSION_ISSUE_LIMIT_PER_IP) {
      throw TooManyRequests('Too many booking sessions. Please wait before scanning again.');
    }
  }

  const session = await createSelfServiceSessionToken({ branchId: branch.id });
  return { ...session, branchName: branch.name };
}

export async function validateSelfServiceSessionSvc(input: {
  branchId: string;
  sessionToken: string;
  cache?: SelfServiceSessionStore;
}) {
  const session = await readSession(
    input.sessionToken,
    false,
    input.cache ?? getSelfServiceSessionStore(),
  );
  if (session.branchId !== input.branchId) throw expiredSessionError();
  return session;
}

export async function consumeSelfServiceSessionSvc(input: {
  branchId: string;
  sessionToken: string;
  cache?: SelfServiceSessionStore;
}) {
  const cache = input.cache ?? getSelfServiceSessionStore();
  const activeSession = await readSession(input.sessionToken, false, cache);
  if (activeSession.branchId !== input.branchId) throw expiredSessionError();
  return readSession(input.sessionToken, true, cache);
}

export async function continueSelfServiceSessionSvc(
  previous: SelfServiceSessionPayload,
  cache?: SelfServiceSessionStore,
  previousToken?: string,
) {
  if (
    previous.bookingNumber >= SELF_SERVICE_BOOKINGS_PER_SCAN ||
    Date.parse(previous.expiresAt) <= Date.now()
  )
    return null;
  return createSelfServiceSessionToken({
    branchId: previous.branchId,
    previous,
    cache,
    token: previousToken ? deriveNextSelfServiceToken(previousToken) : undefined,
  });
}

export function deriveNextSelfServiceToken(previousToken: string) {
  return createHash('sha256')
    .update(`vipex:self-service:next:${previousToken}`)
    .digest('base64url');
}
