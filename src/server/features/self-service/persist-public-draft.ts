import type { PublicDraftResult } from './public-draft.types';
import { readSubmittedDraft, saveSubmissionReceipt } from './submission-receipt';
import { db } from '@/db/config';
import { Conflict } from '@/server/utils/http-error';
import { createSelfServiceDraftRepo } from './drafts.repository';
import { DatabaseSelfServiceSessionStore } from './session-store';
import { consumeSelfServiceSessionSvc, continueSelfServiceSessionSvc } from './session.service';

export async function persistPublicDraft(input: {
  sessionToken: string;
  fingerprint: string;
  beforeCreate?: () => Promise<void>;
  branchName: string;
  values: Parameters<typeof createSelfServiceDraftRepo>[0];
}): Promise<PublicDraftResult> {
  const replay = await readSubmittedDraft(
    input.sessionToken,
    input.values.branchId,
    input.fingerprint,
  );
  if (replay) return replay;
  try {
    return await db.transaction(async (tx) => {
      const cache = new DatabaseSelfServiceSessionStore(tx);
      const consumed = await consumeSelfServiceSessionSvc({
        branchId: input.values.branchId,
        sessionToken: input.sessionToken,
        cache,
      });
      await input.beforeCreate?.();
      // A draft may only be inserted after this request wins token consumption.
      const created = await createSelfServiceDraftRepo(
        { ...input.values, branchId: consumed.branchId },
        tx,
      );
      if (!created) throw Conflict('Unable to submit your booking right now. Please retry.');
      const nextSession = await continueSelfServiceSessionSvc(consumed, cache, input.sessionToken);
      const result = {
        draftId: created.id,
        expiresAt: created.expiresAt.toISOString(),
        bookingsCompleted: consumed.bookingNumber,
        nextSession: nextSession ? { ...nextSession, branchName: input.branchName } : null,
      };
      await saveSubmissionReceipt(
        {
          token: input.sessionToken,
          branchId: input.values.branchId,
          fingerprint: input.fingerprint,
          result,
        },
        cache,
      );
      return result;
    });
  } catch (error) {
    // A concurrent request may consume the token before this transaction acquires its lock.
    if (error && typeof error === 'object' && 'status' in error && error.status === 410) {
      const completed = await readSubmittedDraft(
        input.sessionToken,
        input.values.branchId,
        input.fingerprint,
      );
      if (completed) return completed;
    }
    throw error;
  }
}
