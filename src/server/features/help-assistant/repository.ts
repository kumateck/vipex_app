import { db } from '@/db/config';
import { helpAssistantQueries } from '@/db/schemas';
import { logger } from '@/server/utils/logger';
import type { HelpAssistantLogInput } from './dto';

/**
 * Best-effort: this log is analytics, not the reason a request should fail.
 * Swallow errors (e.g. migration not yet applied) so a logging hiccup never
 * masks the real answer/unavailable response as a raw 500.
 */
export async function logHelpAssistantQueryRepo(input: HelpAssistantLogInput): Promise<void> {
  try {
    await db.insert(helpAssistantQueries).values({
      companyId: input.companyId,
      userId: input.userId,
      question: input.question,
      answer: input.answer,
      provider: input.provider ?? null,
      matchedGuideIds: JSON.stringify(input.matchedGuideIds),
      succeeded: input.succeeded,
      errorReason: input.errorReason ?? null,
    });
  } catch (err) {
    logger.error('help-assistant: failed to log query', err);
  }
}
