import { createHash } from 'node:crypto';
import { Conflict, Gone } from '@/server/utils/http-error';
import { getSelfServiceSessionStore, type SelfServiceSessionStore } from './session-store';
import { deriveNextSelfServiceToken } from './session.service';
import type { PublicDraftResult } from './public-draft.types';

type SubmissionResult = PublicDraftResult;
type Receipt = {
  branchId: string;
  fingerprint: string;
  expiresAt: string;
  result: Omit<SubmissionResult, 'nextSession'> & {
    nextSession: Omit<NonNullable<SubmissionResult['nextSession']>, 'sessionToken'> | null;
  };
};
const receiptKey = (token: string) =>
  `self-service:submission:${createHash('sha256').update(token).digest('hex')}`;

export async function readSubmittedDraft(
  token: string,
  branchId: string,
  fingerprint: string,
  store = getSelfServiceSessionStore(),
): Promise<SubmissionResult | null> {
  if (!token || token.length > 256) return null;
  const raw = await store.get(receiptKey(token));
  if (!raw) return null;
  const receipt = JSON.parse(raw) as Receipt;
  if (Date.parse(receipt.expiresAt) <= Date.now()) return null;
  if (receipt.branchId !== branchId)
    throw Gone('Booking session is not available for this branch', {
      reason: 'SELF_SERVICE_SESSION_EXPIRED',
    });
  if (receipt.fingerprint !== fingerprint)
    throw Conflict(
      'This booking has already been submitted. Start a new booking for different details.',
    );
  return {
    ...receipt.result,
    nextSession: receipt.result.nextSession
      ? { ...receipt.result.nextSession, sessionToken: deriveNextSelfServiceToken(token) }
      : null,
  };
}

export async function saveSubmissionReceipt(
  input: {
    token: string;
    branchId: string;
    fingerprint: string;
    result: SubmissionResult;
  },
  store: SelfServiceSessionStore,
) {
  // Store only token hashes and continuation metadata, never contact fields or raw tokens.
  const nextSession = input.result.nextSession
    ? {
        branchId: input.result.nextSession.branchId,
        branchName: input.result.nextSession.branchName,
        issuedAt: input.result.nextSession.issuedAt,
        expiresAt: input.result.nextSession.expiresAt,
        bookingNumber: input.result.nextSession.bookingNumber,
      }
    : null;
  await store.set(
    receiptKey(input.token),
    JSON.stringify({
      branchId: input.branchId,
      fingerprint: input.fingerprint,
      expiresAt: input.result.expiresAt,
      result: { ...input.result, nextSession },
    } satisfies Receipt),
  );
}
