import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { fleetAnomalyBriefs } from '@/db/schemas';
import { logger } from '@/server/utils/logger';
import type {
  FleetAnomalyBriefResult,
  GetLatestFleetAnomalyBriefInput,
  GroundingSnapshot,
  LogFleetAnomalyBriefInput,
} from './dto';

function toResult(row: typeof fleetAnomalyBriefs.$inferSelect): FleetAnomalyBriefResult {
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

export async function insertFleetAnomalyBriefRepo(
  input: LogFleetAnomalyBriefInput,
): Promise<FleetAnomalyBriefResult | null> {
  try {
    const [created] = await db
      .insert(fleetAnomalyBriefs)
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
    logger.error('fleet-anomaly-brief: failed to persist brief', err);
    return null;
  }
}

export async function getLatestFleetAnomalyBriefRepo(
  input: GetLatestFleetAnomalyBriefInput,
): Promise<FleetAnomalyBriefResult | null> {
  const [row] = await db
    .select()
    .from(fleetAnomalyBriefs)
    .where(eq(fleetAnomalyBriefs.companyId, input.companyId))
    .orderBy(desc(fleetAnomalyBriefs.createdAt))
    .limit(1);

  return row ? toResult(row) : null;
}
