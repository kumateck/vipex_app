import { selectProvider } from '@/server/services/llm/router';
import { ServiceUnavailable } from '@/server/utils/http-error';
import { buildFleetAnomalyGroundingSnapshot } from './aggregation';
import type {
  FleetAnomalyBriefResult,
  GenerateFleetAnomalyBriefInput,
  GetLatestFleetAnomalyBriefInput,
  GroundingSnapshot,
} from './dto';
import { getLatestFleetAnomalyBriefRepo, insertFleetAnomalyBriefRepo } from './repository';

const SYSTEM_PROMPT = `You are a fleet operations analyst narrating pre-computed fleet KPIs for a Fleet Manager at Vipex, a logistics/courier company. You are NOT a statistics engine.

Rules:
- Use ONLY the figures provided below. Every number you state must be copied exactly from the data block — never recompute, estimate, or infer a number that isn't present.
- If a section is marked unavailable in dataCompleteness, say plainly that this data is not currently available rather than guessing or omitting the caveat.
- The maintenance reliability and maintenance KPI figures reflect a trailing window as of generation time (see maintenanceWindowDays), NOT the user's selected date range above — never imply they cover the same period as the other figures. State this distinction plainly if you reference those figures.
- Fuel-fraud "flagged"/"high risk" trips are rule-based signals (variance, cost-per-km, rapid-refuel pattern), not verified fraud — describe them as "flagged for review," never as "confirmed fraud."
- Structure the answer as: 1) one-paragraph headline (overall fleet health status and why), 2) top anomalies and risks (driver, route, fuel, maintenance), 3) what needs attention this period.
- Keep it under ~250 words, plain business language, no jargon.`;

function formatSnapshot(snapshot: GroundingSnapshot): string {
  const lines: string[] = [
    `Period: ${snapshot.periodFrom} to ${snapshot.periodTo}${snapshot.branchId ? ` (branch ${snapshot.branchId})` : ' (fleet-wide)'}`,
    `Overall status: ${snapshot.overallStatus ?? 'unknown'} (${snapshot.metTargets ?? 0}/${snapshot.totalTargets ?? 0} KPI targets met) [executiveScorecard: ${snapshot.dataCompleteness.executiveScorecard}]`,
    `Routes: ${snapshot.routeCount ?? 0}, Branches: ${snapshot.branchCount ?? 0}, Customers: ${snapshot.customerCount ?? 0} [unitEconomics: ${snapshot.dataCompleteness.unitEconomics}]`,
    `Fuel-fraud signals: ${snapshot.fuelFraudTripsAnalyzed ?? 0} trips analyzed, ${snapshot.fuelFraudFlaggedTrips ?? 0} flagged for review, ${snapshot.fuelFraudHighRiskTrips ?? 0} high-risk [fuelFraudSignals: ${snapshot.dataCompleteness.fuelFraudSignals}]`,
    `Maintenance reliability (trailing ${snapshot.maintenanceWindowDays}d as of generation): ${snapshot.reliabilityTotalFailures ?? 0} failures, ${Math.round(snapshot.reliabilityTotalDowntimeMinutes ?? 0)} total downtime minutes, latest-month MTBF ${snapshot.reliabilityLatestMonthMtbfHours != null ? `${Math.round(snapshot.reliabilityLatestMonthMtbfHours)}h` : 'n/a'}, latest-month MTTR ${snapshot.reliabilityLatestMonthMttrMinutes != null ? `${Math.round(snapshot.reliabilityLatestMonthMttrMinutes)}min` : 'n/a'} [maintenanceReliabilityTrends: ${snapshot.dataCompleteness.maintenanceReliabilityTrends}]`,
    `Maintenance KPIs (trailing ${snapshot.maintenanceWindowDays}d as of generation): open backlog ${snapshot.maintenanceOpenBacklog ?? 0}, SLA breach ${snapshot.maintenanceSlaBreachPct != null ? `${Math.round(snapshot.maintenanceSlaBreachPct)}%` : 'n/a'}, mean time to repair ${snapshot.maintenanceMeanTimeToRepairHours != null ? `${Math.round(snapshot.maintenanceMeanTimeToRepairHours)}h` : 'n/a'}, active downtime events ${snapshot.maintenanceActiveDowntime ?? 0} [maintenanceKpiDashboard: ${snapshot.dataCompleteness.maintenanceKpiDashboard}]`,
  ];

  if (snapshot.topDriverRisks.length) {
    lines.push('Top driver risks:');
    for (const row of snapshot.topDriverRisks) {
      lines.push(
        `- ${row.driverEmployeeName ?? 'Unknown driver'}: ${row.anomalyCount} anomalies, ${row.averageVariancePct.toFixed(1)}% avg variance`,
      );
    }
  }

  if (snapshot.topRouteCostRisks.length) {
    lines.push('Top route cost risks:');
    for (const row of snapshot.topRouteCostRisks) {
      lines.push(
        `- ${row.routePlanName ?? 'Unassigned route'}: GHS ${row.costPerKm.toFixed(2)}/km`,
      );
    }
  }

  if (snapshot.maintenanceTopReasons.length) {
    lines.push('Top recurring maintenance reasons:');
    for (const row of snapshot.maintenanceTopReasons) {
      lines.push(`- ${row.reason}: ${row.count} occurrences`);
    }
  }

  return lines.join('\n');
}

export async function generateFleetAnomalyBriefSvc(
  input: GenerateFleetAnomalyBriefInput,
): Promise<FleetAnomalyBriefResult> {
  const snapshot = await buildFleetAnomalyGroundingSnapshot(input);
  const provider = selectProvider('complex');

  if (!provider) {
    await insertFleetAnomalyBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: input.branchId ?? null,
      periodFrom: input.from,
      periodTo: input.to,
      groundingSnapshot: snapshot,
      narrative: null,
      provider: null,
      succeeded: false,
      errorReason: 'no_provider_configured',
    });
    throw ServiceUnavailable(
      'Fleet anomaly briefs are not set up yet. The figures above are still accurate — only the narrative is unavailable.',
    );
  }

  try {
    const result = await provider.complete('complex', {
      systemPrompt: SYSTEM_PROMPT,
      userMessage: formatSnapshot(snapshot),
    });

    if (!result.text) throw new Error('Empty response from provider');

    const saved = await insertFleetAnomalyBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: input.branchId ?? null,
      periodFrom: input.from,
      periodTo: input.to,
      groundingSnapshot: snapshot,
      narrative: result.text,
      provider: result.provider,
      succeeded: true,
    });

    if (saved) return saved;

    return {
      id: 'unsaved',
      periodFrom: input.from,
      periodTo: input.to,
      branchId: input.branchId ?? null,
      narrative: result.text,
      provider: result.provider,
      succeeded: true,
      grounding: snapshot,
      generatedByUserId: input.userId,
      createdAt: new Date().toISOString(),
    };
  } catch {
    await insertFleetAnomalyBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: input.branchId ?? null,
      periodFrom: input.from,
      periodTo: input.to,
      groundingSnapshot: snapshot,
      narrative: null,
      provider: provider.name,
      succeeded: false,
      errorReason: 'provider_error',
    });
    throw ServiceUnavailable(
      'Could not generate the fleet anomaly brief right now. The figures above are still accurate.',
    );
  }
}

export async function getLatestFleetAnomalyBriefSvc(
  input: GetLatestFleetAnomalyBriefInput,
): Promise<FleetAnomalyBriefResult | null> {
  return getLatestFleetAnomalyBriefRepo(input);
}
