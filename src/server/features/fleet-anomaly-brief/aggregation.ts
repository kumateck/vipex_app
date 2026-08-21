import {
  getFleetExecutiveScorecardSvc,
  getFleetFuelFraudSignalsSvc,
  getFleetMaintenanceKpiDashboardSvc,
  getFleetMaintenanceReliabilityTrendsSvc,
  getFleetUnitEconomicsSvc,
} from '@/server/features/fleet-transport/service';
import { safeCall } from '@/server/services/ai-briefs/safe-call';
import type { FleetAnomalyBriefScope, GroundingSnapshot } from './dto';

function deriveWindowDays(from: string, to: string): number {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) return 30;
  return Math.max(1, Math.min(365, Math.ceil((toMs - fromMs) / 86_400_000)));
}

export async function buildFleetAnomalyGroundingSnapshot(
  scope: FleetAnomalyBriefScope,
): Promise<GroundingSnapshot> {
  const { companyId, branchId, from, to } = scope;
  const dateFrom = new Date(from);
  const dateTo = new Date(to);
  const maintenanceWindowDays = deriveWindowDays(from, to);

  const [scorecard, unitEconomics, fuelFraud, reliability, maintenanceKpi] = await Promise.all([
    safeCall('fleet executive scorecard', () =>
      getFleetExecutiveScorecardSvc({ companyId, dateFrom, dateTo }),
    ),
    safeCall('fleet unit economics', () =>
      getFleetUnitEconomicsSvc({ companyId, dateFrom, dateTo }),
    ),
    safeCall('fleet fuel fraud signals', () =>
      getFleetFuelFraudSignalsSvc({ companyId, branchId, dateFrom, dateTo }),
    ),
    safeCall('fleet maintenance reliability trends', () =>
      getFleetMaintenanceReliabilityTrendsSvc({ companyId, windowDays: maintenanceWindowDays }),
    ),
    safeCall('fleet maintenance KPI dashboard', () =>
      getFleetMaintenanceKpiDashboardSvc({ companyId, windowDays: maintenanceWindowDays }),
    ),
  ]);

  const latestMonth = reliability?.monthly[reliability.monthly.length - 1] ?? null;

  return {
    periodFrom: from,
    periodTo: to,
    branchId: branchId ?? null,
    maintenanceWindowDays,
    overallStatus: scorecard?.summary.overallStatus ?? null,
    metTargets: scorecard?.summary.metTargets ?? null,
    totalTargets: scorecard?.summary.totalTargets ?? null,
    topDriverRisks: (scorecard?.topDriverRisks ?? []).slice(0, 5).map((row) => ({
      driverEmployeeName: row.driverEmployeeName ?? null,
      anomalyCount: row.anomalyCount,
      averageVariancePct: row.averageVariancePct,
    })),
    topRouteCostRisks: (scorecard?.topRouteCostRisks ?? []).slice(0, 5).map((row) => ({
      routePlanName: row.routePlanName ?? null,
      costPerKm: row.costPerKm,
    })),
    routeCount: unitEconomics?.summary.routeCount ?? null,
    branchCount: unitEconomics?.summary.branchCount ?? null,
    customerCount: unitEconomics?.summary.customerCount ?? null,
    topRouteCostPerKm: (unitEconomics?.benchmarkCuts.topRouteCostPerKm ?? [])
      .slice(0, 3)
      .map((row) => ({
        routePlanName: row.routePlanName ?? null,
        costPerKm: row.costPerKm,
      })),
    topBranchCostPerParcel: (unitEconomics?.benchmarkCuts.topBranchCostPerParcel ?? [])
      .slice(0, 3)
      .map((row) => ({
        branchName: row.branchName ?? null,
        costPerParcel: row.costPerParcel,
      })),
    fuelFraudTripsAnalyzed: fuelFraud?.summary.tripsAnalyzed ?? null,
    fuelFraudFlaggedTrips: fuelFraud?.summary.flaggedTrips ?? null,
    fuelFraudHighRiskTrips: fuelFraud?.summary.highRiskTrips ?? null,
    reliabilityTotalFailures: reliability?.summary.totalFailures ?? null,
    reliabilityTotalDowntimeMinutes: reliability?.summary.totalDowntimeMinutes ?? null,
    reliabilityLatestMonthMtbfHours: latestMonth?.mtbfHours ?? null,
    reliabilityLatestMonthMttrMinutes: latestMonth?.mttrMinutes ?? null,
    maintenanceOpenBacklog: maintenanceKpi?.summary.openBacklog ?? null,
    maintenanceSlaBreachPct: maintenanceKpi?.summary.slaBreachPct ?? null,
    maintenanceMeanTimeToRepairHours: maintenanceKpi?.summary.meanTimeToRepairHours ?? null,
    maintenanceActiveDowntime: maintenanceKpi?.summary.activeDowntime ?? null,
    maintenanceTopReasons: (maintenanceKpi?.topReasons ?? []).slice(0, 5),
    dataCompleteness: {
      executiveScorecard: scorecard !== null,
      unitEconomics: unitEconomics !== null,
      fuelFraudSignals: fuelFraud !== null,
      maintenanceReliabilityTrends: reliability !== null,
      maintenanceKpiDashboard: maintenanceKpi !== null,
    },
  };
}
