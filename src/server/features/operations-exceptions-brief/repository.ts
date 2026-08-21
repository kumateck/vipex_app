import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { operationsExceptionsBriefs } from '@/db/schemas';
import { logger } from '@/server/utils/logger';
import type {
  OperationsExceptionsBriefResult,
  GetLatestOperationsExceptionsBriefInput,
  GroundingSnapshot,
  LogOperationsExceptionsBriefInput,
} from './dto';

function toResult(
  row: typeof operationsExceptionsBriefs.$inferSelect,
): OperationsExceptionsBriefResult {
  let grounding: GroundingSnapshot | null = null;
  try {
    grounding = JSON.parse(row.groundingSnapshot) as GroundingSnapshot;
  } catch {
    grounding = null;
  }

  return {
    id: row.id,
    periodFrom: row.periodFrom.toISOString(),
    periodTo: row.periodTo.toISOString(),
    branchId: row.branchId,
    narrative: row.narrative,
    provider: row.provider,
    succeeded: row.succeeded,
    grounding,
    generatedByUserId: row.generatedByUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function insertOperationsExceptionsBriefRepo(
  input: LogOperationsExceptionsBriefInput,
): Promise<OperationsExceptionsBriefResult | null> {
  try {
    const [created] = await db
      .insert(operationsExceptionsBriefs)
      .values({
        companyId: input.companyId,
        generatedByUserId: input.generatedByUserId,
        branchId: input.branchId,
        periodFrom: new Date(input.periodFrom),
        periodTo: new Date(input.periodTo),
        groundingSnapshot: JSON.stringify(input.groundingSnapshot),
        narrative: input.narrative,
        provider: input.provider,
        succeeded: input.succeeded,
        errorReason: input.errorReason ?? null,
      })
      .returning();

    return created ? toResult(created) : null;
  } catch (err) {
    logger.error('operations-exceptions-brief: failed to persist brief', err);
    return null;
  }
}

export async function getLatestOperationsExceptionsBriefRepo(
  input: GetLatestOperationsExceptionsBriefInput,
): Promise<OperationsExceptionsBriefResult | null> {
  const where = [eq(operationsExceptionsBriefs.companyId, input.companyId)];
  where.push(
    input.branchId
      ? eq(operationsExceptionsBriefs.branchId, input.branchId)
      : isNull(operationsExceptionsBriefs.branchId),
  );

  const [row] = await db
    .select()
    .from(operationsExceptionsBriefs)
    .where(and(...where))
    .orderBy(desc(operationsExceptionsBriefs.createdAt))
    .limit(1);

  return row ? toResult(row) : null;
}
