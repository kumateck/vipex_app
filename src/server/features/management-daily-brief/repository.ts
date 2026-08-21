import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { managementDailyBriefs } from '@/db/schemas';
import { logger } from '@/server/utils/logger';
import type {
  ManagementDailyBriefResult,
  GetLatestManagementDailyBriefInput,
  GroundingSnapshot,
  LogManagementDailyBriefInput,
} from './dto';

function toResult(row: typeof managementDailyBriefs.$inferSelect): ManagementDailyBriefResult {
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

export async function insertManagementDailyBriefRepo(
  input: LogManagementDailyBriefInput,
): Promise<ManagementDailyBriefResult | null> {
  try {
    const [created] = await db
      .insert(managementDailyBriefs)
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
    logger.error('management-daily-brief: failed to persist brief', err);
    return null;
  }
}

export async function getLatestManagementDailyBriefRepo(
  input: GetLatestManagementDailyBriefInput,
): Promise<ManagementDailyBriefResult | null> {
  const [row] = await db
    .select()
    .from(managementDailyBriefs)
    .where(eq(managementDailyBriefs.companyId, input.companyId))
    .orderBy(desc(managementDailyBriefs.createdAt))
    .limit(1);

  return row ? toResult(row) : null;
}
