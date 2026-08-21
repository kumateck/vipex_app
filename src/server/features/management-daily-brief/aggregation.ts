import { getLatestExecutiveInsightsSvc } from '@/server/features/executive-insights/service';
import { getLatestFleetAnomalyBriefSvc } from '@/server/features/fleet-anomaly-brief/service';
import { getLatestOperationsExceptionsBriefSvc } from '@/server/features/operations-exceptions-brief/service';
import { safeCall } from '@/server/services/ai-briefs/safe-call';
import type { ManagementDailyBriefScope, GroundingSnapshot, SubBriefSummary } from './dto';

const STALE_AFTER_HOURS = 48;

function toSubBriefSummary(
  brief: { createdAt: string; succeeded: boolean; narrative: string | null } | null,
): SubBriefSummary {
  if (!brief) {
    return { available: false, isStale: false, asOf: null, succeeded: null, narrative: null };
  }
  const ageHours = (Date.now() - new Date(brief.createdAt).getTime()) / 3_600_000;
  return {
    available: true,
    isStale: ageHours > STALE_AFTER_HOURS,
    asOf: brief.createdAt,
    succeeded: brief.succeeded,
    narrative: brief.narrative,
  };
}

export async function buildManagementDailyBriefSnapshot(
  scope: ManagementDailyBriefScope,
): Promise<GroundingSnapshot> {
  const { companyId } = scope;

  const [executiveInsights, fleetAnomalyBrief, operationsExceptionsBrief] = await Promise.all([
    safeCall('latest executive insights', () =>
      getLatestExecutiveInsightsSvc({ companyId, branchId: null }),
    ),
    safeCall('latest fleet anomaly brief', () => getLatestFleetAnomalyBriefSvc({ companyId })),
    safeCall('latest operations exceptions brief', () =>
      getLatestOperationsExceptionsBriefSvc({ companyId, branchId: null }),
    ),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    staleAfterHours: STALE_AFTER_HOURS,
    executiveInsights: toSubBriefSummary(executiveInsights),
    fleetAnomalyBrief: toSubBriefSummary(fleetAnomalyBrief),
    operationsExceptionsBrief: toSubBriefSummary(operationsExceptionsBrief),
    dataCompleteness: {
      executiveInsights: executiveInsights !== null,
      fleetAnomalyBrief: fleetAnomalyBrief !== null,
      operationsExceptionsBrief: operationsExceptionsBrief !== null,
    },
  };
}
