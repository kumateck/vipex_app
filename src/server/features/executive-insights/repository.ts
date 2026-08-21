import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { executiveInsights } from '@/db/schemas';
import { logger } from '@/server/utils/logger';
import type {
  ExecutiveInsightsResult,
  GetLatestExecutiveInsightsInput,
  GroundingSnapshot,
  LogExecutiveInsightInput,
} from './dto';

function toResult(row: typeof executiveInsights.$inferSelect): ExecutiveInsightsResult {
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

export async function insertExecutiveInsightRepo(
  input: LogExecutiveInsightInput,
): Promise<ExecutiveInsightsResult | null> {
  try {
    const [created] = await db
      .insert(executiveInsights)
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
    logger.error('executive-insights: failed to persist insight', err);
    return null;
  }
}

export async function getLatestExecutiveInsightRepo(
  input: GetLatestExecutiveInsightsInput,
): Promise<ExecutiveInsightsResult | null> {
  const where = [eq(executiveInsights.companyId, input.companyId)];
  where.push(
    input.branchId
      ? eq(executiveInsights.branchId, input.branchId)
      : isNull(executiveInsights.branchId),
  );

  const [row] = await db
    .select()
    .from(executiveInsights)
    .where(and(...where))
    .orderBy(desc(executiveInsights.createdAt))
    .limit(1);

  return row ? toResult(row) : null;
}
