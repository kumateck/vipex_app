export type FleetAnomalyBriefScope = {
  companyId: string;
  branchId?: string | null;
  from: string;
  to: string;
};

export type GenerateFleetAnomalyBriefInput = FleetAnomalyBriefScope & {
  userId: string;
};

export type GetLatestFleetAnomalyBriefInput = {
  companyId: string;
};

export type DriverRiskFigure = {
  driverEmployeeName: string | null;
  anomalyCount: number;
  averageVariancePct: number;
};

export type RouteCostRiskFigure = {
  routePlanName: string | null;
  costPerKm: number;
};

export type BranchCostRiskFigure = {
  branchName: string | null;
  costPerParcel: number;
};

export type MaintenanceReasonFigure = {
  reason: string;
  count: number;
};

export type DataCompleteness = {
  executiveScorecard: boolean;
  unitEconomics: boolean;
  fuelFraudSignals: boolean;
  maintenanceReliabilityTrends: boolean;
  maintenanceKpiDashboard: boolean;
};

export type GroundingSnapshot = {
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  // Maintenance reliability/KPI sources only support a trailing window from
  // "now", not the user's selected period — surfaced explicitly so the
  // prompt/UI never conflate the two.
  maintenanceWindowDays: number;
  overallStatus: string | null;
  metTargets: number | null;
  totalTargets: number | null;
  topDriverRisks: DriverRiskFigure[];
  topRouteCostRisks: RouteCostRiskFigure[];
  routeCount: number | null;
  branchCount: number | null;
  customerCount: number | null;
  topRouteCostPerKm: RouteCostRiskFigure[];
  topBranchCostPerParcel: BranchCostRiskFigure[];
  fuelFraudTripsAnalyzed: number | null;
  fuelFraudFlaggedTrips: number | null;
  fuelFraudHighRiskTrips: number | null;
  reliabilityTotalFailures: number | null;
  reliabilityTotalDowntimeMinutes: number | null;
  reliabilityLatestMonthMtbfHours: number | null;
  reliabilityLatestMonthMttrMinutes: number | null;
  maintenanceOpenBacklog: number | null;
  maintenanceSlaBreachPct: number | null;
  maintenanceMeanTimeToRepairHours: number | null;
  maintenanceActiveDowntime: number | null;
  maintenanceTopReasons: MaintenanceReasonFigure[];
  dataCompleteness: DataCompleteness;
};

export type FleetAnomalyBriefResult = {
  id: string;
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  narrative: string | null;
  provider: string | null;
  succeeded: boolean;
  grounding: GroundingSnapshot | null;
  generatedByUserId: string;
  createdAt: string;
};

export type LogFleetAnomalyBriefInput = {
  companyId: string;
  generatedByUserId: string;
  branchId: string | null;
  periodFrom: string;
  periodTo: string;
  groundingSnapshot: GroundingSnapshot;
  narrative: string | null;
  provider: string | null;
  succeeded: boolean;
  errorReason?: string | null;
};
