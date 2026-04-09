import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { sendMail } from '@/server/services/mail/mailer';
import {
  findCompanyModuleRepo,
  updateCompanyModuleSettingsRepo,
} from '../company-modules/repository';
import {
  FleetComplianceIncidentSeverity,
  FleetComplianceIncidentType,
  FleetPolicyAckStatus,
  FleetShiftRosterRole,
  FleetShiftRosterStatus,
  FleetFuelLogStatus,
  FleetVehicleFuelType,
  FleetMaintenanceIntervalUnit,
  FleetTripLoadMatchStatus,
  FleetMaintenanceWorkOrderStatus,
  FleetTripEventType,
  FleetTripStatus,
  FleetTripStatusUpdateType,
  FleetVehicleLifecycleStatus,
  FleetVehicleOwnershipType,
  ProcurementDemandStatus,
  ProcurementDemandUrgency,
  fleetFuelLogs,
  fleetShiftRosters,
  fleetTripLoadMatches,
  fleetMaintenanceWorkOrders,
  fleetTrips,
  fleetVehicles,
} from '@/db/schemas';
import {
  createFleetDriverComplianceRecordRepo,
  createFleetDowntimeEventRepo,
  createFleetMaintenancePlanRepo,
  createFleetMaintenancePartMovementRepo,
  createFleetMaintenancePartRepo,
  createFleetMaintenanceWorkOrderRepo,
  createFleetComplianceIncidentRepo,
  createFleetShiftRosterRepo,
  createFleetTripLoadMatchRepo,
  createFleetVehicleDocumentRepo,
  createFleetTripStatusUpdateRepo,
  createFleetTripTelemetryPointRepo,
  createFleetTripRepo,
  createFleetTripEventRepo,
  createFleetFuelLogRepo,
  createFleetVehicleRepo,
  findActiveFleetTripByDriverRepo,
  findActiveFleetTripByVehicleRepo,
  findActiveFleetLoadMatchForParcelRepo,
  findOpenWorkOrderByPlanRepo,
  findFleetParcelByIdRepo,
  findFleetShiftConflictsRepo,
  findFleetVehicleByPlateRepo,
  getEmployeeByIdRepo,
  getFleetDowntimeEventByIdRepo,
  getFleetFuelLogByIdRepo,
  getFleetComplianceIncidentByIdRepo,
  getFleetComplianceKpiRepo,
  getFleetMaintenancePlanByIdRepo,
  getFleetMaintenancePartByIdRepo,
  getFleetMaintenanceWorkOrderByIdRepo,
  getFleetDispatchBoardMetricsRepo,
  getFleetDispatchOpsPerformanceRepo,
  getFleetShiftRosterByIdRepo,
  getFleetTripLoadMatchByIdRepo,
  getFleetTripByIdRepo,
  getFleetVehicleByIdRepo,
  isEmployeeAssignableToFleet,
  listFleetDowntimeEventsRepo,
  listCompletedTripsForFuelAnalyticsRepo,
  listFleetComplianceAlertRecipientUsersRepo,
  listFleetComplianceDashboardAlertsRepo,
  listFleetDriverComplianceAlertsRepo,
  listFleetDriverComplianceRecordsRepo,
  listFleetDriverOptionsRepo,
  listFleetMaintenancePlansRepo,
  listFleetMaintenancePartsRepo,
  listFleetMaintenancePartMovementsRepo,
  listFleetMaintenancePartMovementsByWorkOrderRepo,
  listFleetMaintenanceProcurementTraceabilityRepo,
  listFleetMaintenanceWorkOrdersRepo,
  listFleetComplianceIncidentsRepo,
  listFleetPolicyAcknowledgmentsRepo,
  listFleetRoutePlansRepo,
  listFleetRoutePlanStopsRepo,
  listFleetVehicleComplianceAlertsRepo,
  sumApprovedFuelLogsForTripWindowRepo,
  listFleetTripCrewRepo,
  listFleetTripEventsRepo,
  listFleetTripLoadMatchesRepo,
  listFleetTripLoadAuditTrailRepo,
  listFleetDispatchLoadCandidatesRepo,
  listFleetTripLoadCountsRepo,
  listFleetTripCustomerStatsRepo,
  listFleetTripStatusUpdatesRepo,
  listFleetTripTelemetryPointsRepo,
  listFleetTripsRepo,
  listFleetVehicleDocumentsRepo,
  listFleetFuelLogsRepo,
  listFleetShiftRostersRepo,
  listFleetVehicleOptionsRepo,
  listFleetVehiclesRepo,
  listFleetLowStockPartsRepo,
  listFleetLowStockProcurementCandidatesRepo,
  listFleetVehiclesForLifecycleRecoveryRepo,
  listOpenFleetComplianceIncidentsForEscalationRepo,
  listFleetPolicyReackTargetsRepo,
  replaceFleetRoutePlanStopsRepo,
  replaceFleetTripCrewRepo,
  type ListFleetFuelLogsParams,
  type ListFleetDowntimeEventsParams,
  type ListFleetMaintenancePlansParams,
  type ListFleetMaintenancePartsParams,
  type ListFleetMaintenanceWorkOrdersParams,
  type ListFleetComplianceIncidentsParams,
  type ListFleetPolicyAcknowledgmentsParams,
  type ListFleetRoutePlansParams,
  type ListFleetShiftRostersParams,
  type ListFleetTripsParams,
  type ListFleetVehiclesParams,
  closeFleetDowntimeEventRepo,
  updateFleetDowntimeEventRepo,
  createFleetRoutePlanRepo,
  createFleetComplianceAlertDispatchRepo,
  getFleetRoutePlanByIdRepo,
  updateFleetMaintenancePlanRepo,
  updateFleetMaintenanceWorkOrderRepo,
  updateFleetComplianceAlertDispatchRepo,
  updateFleetComplianceIncidentRepo,
  updateFleetFuelLogStatusRepo,
  updateFleetMaintenancePartRepo,
  updateFleetShiftRosterRepo,
  updateFleetTripLoadMatchRepo,
  updateFleetTripRepo,
  updateFleetVehicleLifecycleRepo,
  updateFleetVehicleRepo,
  upsertFleetPolicyAcknowledgmentRepo,
  listFleetVehiclesForLifecycleAutomationRepo,
} from './repository';
import {
  createProcurementDemandRepo,
  findOpenProcurementDemandByDedupeKeyRepo,
  findProcurementFleetPolicyByBranchRepo,
} from '../procurement/repository';

function buildFuelLogNo() {
  return `FL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function buildTripNo() {
  return `TR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function buildWorkOrderNo() {
  return `WO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function buildDemandNo() {
  return `DM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function addPlanInterval(base: Date, intervalUnit: number, intervalValue: number) {
  const next = new Date(base);
  if (intervalValue <= 0) return next;
  if (intervalUnit === FleetMaintenanceIntervalUnit.DAYS) {
    next.setDate(next.getDate() + intervalValue);
    return next;
  }
  if (intervalUnit === FleetMaintenanceIntervalUnit.WEEKS) {
    next.setDate(next.getDate() + intervalValue * 7);
    return next;
  }
  if (intervalUnit === FleetMaintenanceIntervalUnit.MONTHS) {
    next.setMonth(next.getMonth() + intervalValue);
    return next;
  }
  return next;
}

function isDriverTitle(title: string | null | undefined) {
  if (!title) return false;
  return /\bdriver\b/i.test(title.trim());
}

function driverComplianceTypeLabel(value: number) {
  if (value === 0) return 'License expiry';
  if (value === 1) return 'Training compliance expiry';
  if (value === 2) return 'Medical clearance expiry';
  if (value === 3) return 'Background check expiry';
  return 'Compliance expiry';
}

function workOrderStatusLabel(value: number) {
  if (value === FleetMaintenanceWorkOrderStatus.OPEN) return 'Open';
  if (value === FleetMaintenanceWorkOrderStatus.IN_PROGRESS) return 'In progress';
  if (value === FleetMaintenanceWorkOrderStatus.COMPLETED) return 'Completed';
  if (value === FleetMaintenanceWorkOrderStatus.CANCELLED) return 'Cancelled';
  return 'Unknown';
}

function tripEventLabel(value: number) {
  if (value === FleetTripEventType.CHECK_IN) return 'CHECK_IN';
  if (value === FleetTripEventType.CHECK_OUT) return 'CHECK_OUT';
  return 'UNKNOWN';
}

function tripLoadMatchLabel(value: number) {
  if (value === FleetTripLoadMatchStatus.ASSIGNED) return 'ASSIGNED';
  if (value === FleetTripLoadMatchStatus.LOADED) return 'LOADED';
  if (value === FleetTripLoadMatchStatus.UNLOADED) return 'UNLOADED';
  if (value === FleetTripLoadMatchStatus.CANCELLED) return 'CANCELLED';
  return 'UNKNOWN';
}

function tripStatusUpdateLabel(value: number) {
  if (value === FleetTripStatusUpdateType.EN_ROUTE) return 'EN_ROUTE';
  if (value === FleetTripStatusUpdateType.AT_PICKUP) return 'AT_PICKUP';
  if (value === FleetTripStatusUpdateType.AT_DROPOFF) return 'AT_DROPOFF';
  if (value === FleetTripStatusUpdateType.DELAYED) return 'DELAYED';
  if (value === FleetTripStatusUpdateType.STOPPED) return 'STOPPED';
  return 'UNKNOWN';
}

const DOWNTIME_RCA_NOTE_PREFIX = '[RCA]';

type DowntimeRcaWorkflow = {
  reasonCategory: string | null;
  lifecycleStatus: number;
  rootCause: string | null;
  correctiveAction: string | null;
  escalationLevel: number;
  reopenedCount: number;
  lastReopenedAt: string | null;
  updatedAt: string | null;
};

function parseDowntimeRcaWorkflow(note: string | null | undefined): DowntimeRcaWorkflow {
  if (!note?.trim() || !note.startsWith(DOWNTIME_RCA_NOTE_PREFIX)) {
    return {
      reasonCategory: null,
      lifecycleStatus: 0,
      rootCause: null,
      correctiveAction: null,
      escalationLevel: 0,
      reopenedCount: 0,
      lastReopenedAt: null,
      updatedAt: null,
    };
  }
  const json = note.slice(DOWNTIME_RCA_NOTE_PREFIX.length);
  try {
    const parsed = JSON.parse(json) as Partial<DowntimeRcaWorkflow>;
    return {
      reasonCategory: parsed.reasonCategory ?? null,
      lifecycleStatus: typeof parsed.lifecycleStatus === 'number' ? parsed.lifecycleStatus : 0,
      rootCause: parsed.rootCause ?? null,
      correctiveAction: parsed.correctiveAction ?? null,
      escalationLevel: typeof parsed.escalationLevel === 'number' ? parsed.escalationLevel : 0,
      reopenedCount: typeof parsed.reopenedCount === 'number' ? parsed.reopenedCount : 0,
      lastReopenedAt: parsed.lastReopenedAt ?? null,
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return {
      reasonCategory: null,
      lifecycleStatus: 0,
      rootCause: null,
      correctiveAction: null,
      escalationLevel: 0,
      reopenedCount: 0,
      lastReopenedAt: null,
      updatedAt: null,
    };
  }
}

function buildDowntimeRcaWorkflowNote(input: DowntimeRcaWorkflow) {
  return `${DOWNTIME_RCA_NOTE_PREFIX}${JSON.stringify(input)}`;
}

function isValidLifecycleTransition(from: number, to: number) {
  if (from === to) return true;
  const allowed = new Map<number, number[]>([
    [0, [1, 2, 3]], // ACTIVE -> MAINTENANCE/RETIRED/DECOMMISSIONED
    [1, [0, 2, 3]], // IN_MAINTENANCE -> ACTIVE/RETIRED/DECOMMISSIONED
    [2, [3]], // RETIRED -> DECOMMISSIONED
    [3, []], // DECOMMISSIONED -> terminal
  ]);
  return (allowed.get(from) ?? []).includes(to);
}

function complianceDashboardStatus(
  daysUntilDue: number,
): 'expired' | 'due_7' | 'due_30' | 'due_60' {
  if (daysUntilDue < 0) return 'expired';
  if (daysUntilDue <= 7) return 'due_7';
  if (daysUntilDue <= 30) return 'due_30';
  return 'due_60';
}

function matchesComplianceStatusFilter(
  status: 'expired' | 'due_7' | 'due_30' | 'due_60',
  filter: 'all' | 'expired' | 'due_7' | 'due_30' | 'due_60',
) {
  if (filter === 'all') return true;
  if (filter === 'expired') return status === 'expired';
  if (filter === 'due_7') return status === 'due_7';
  if (filter === 'due_30') return status === 'due_7' || status === 'due_30';
  return status === 'due_7' || status === 'due_30' || status === 'due_60';
}

export async function listFleetVehiclesSvc(params: ListFleetVehiclesParams) {
  return listFleetVehiclesRepo(params);
}

export async function listFleetVehicleOptionsSvc(input: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  return listFleetVehicleOptionsRepo(input);
}

export async function createFleetVehicleSvc(input: {
  companyId: string;
  createdBy: string;
  branchId?: string | null;
  plateNumber: string;
  model: string;
  year?: number | null;
  vin?: string | null;
  ownershipType?: number;
  lessorName?: string | null;
  leaseStartAt?: Date | null;
  leaseEndAt?: Date | null;
  fuelType?: number;
  expectedKmPerLiter?: number | null;
  tankCapacityLiters?: number | null;
  payloadCapacityKg?: number | null;
  cargoCapacityCbm?: number | null;
  lifecycleStatus?: number;
  insuranceExpiryAt?: Date | null;
  roadworthyExpiryAt?: Date | null;
  assignedDriverUserId?: string | null;
}) {
  const exists = await findFleetVehicleByPlateRepo(input.companyId, input.plateNumber);
  if (exists) throw Conflict('Vehicle with this plate number already exists');
  if (
    input.leaseStartAt &&
    input.leaseEndAt &&
    input.leaseEndAt.getTime() < input.leaseStartAt.getTime()
  ) {
    throw Conflict('Lease end date cannot be earlier than lease start date');
  }

  const created = await createFleetVehicleRepo({
    companyId: input.companyId,
    createdBy: input.createdBy,
    branchId: input.branchId ?? null,
    plateNumber: input.plateNumber,
    model: input.model,
    year: input.year ?? null,
    vin: input.vin ?? null,
    ownershipType: input.ownershipType ?? 0,
    lessorName: input.lessorName ?? null,
    leaseStartAt: input.leaseStartAt ?? null,
    leaseEndAt: input.leaseEndAt ?? null,
    fuelType: input.fuelType ?? 1,
    expectedKmPerLiter: input.expectedKmPerLiter ?? null,
    tankCapacityLiters: input.tankCapacityLiters ?? null,
    payloadCapacityKg: input.payloadCapacityKg ?? null,
    cargoCapacityCbm: input.cargoCapacityCbm ?? null,
    lifecycleStatus: input.lifecycleStatus ?? 0,
    insuranceExpiryAt: input.insuranceExpiryAt ?? null,
    roadworthyExpiryAt: input.roadworthyExpiryAt ?? null,
    assignedDriverUserId: input.assignedDriverUserId ?? null,
  });

  if (!created) throw Conflict('Failed to create vehicle');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'fleet_vehicle',
    entityId: created.id,
    action: 'FLEET_VEHICLE_CREATED',
    message: `Vehicle created: ${input.plateNumber}`,
  });

  return created;
}

export async function updateFleetVehicleSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: Partial<typeof fleetVehicles.$inferInsert>;
}) {
  if (input.patch.leaseStartAt && input.patch.leaseEndAt) {
    if (input.patch.leaseEndAt.getTime() < input.patch.leaseStartAt.getTime()) {
      throw Conflict('Lease end date cannot be earlier than lease start date');
    }
  }
  const updated = await updateFleetVehicleRepo(input.id, input.companyId, input.patch);
  if (!updated) throw NotFound('Vehicle not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_vehicle',
    entityId: input.id,
    action: 'FLEET_VEHICLE_UPDATED',
    message: 'Vehicle updated',
    metadata: { patch: input.patch },
  });

  return updated;
}

export async function listFleetFuelAnalyticsSvc(input: {
  companyId: string;
  vehicleId?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
  expectedOveruseThresholdPct?: number;
  defaultExpectedKmPerLiter?: number;
}) {
  const limit = Math.max(1, Math.min(300, input.limit ?? 100));
  const expectedOveruseThresholdPct = Math.max(
    0,
    Math.min(500, input.expectedOveruseThresholdPct ?? 20),
  );
  const defaultExpectedKmPerLiter = Math.max(1, input.defaultExpectedKmPerLiter ?? 6);

  const trips = await listCompletedTripsForFuelAnalyticsRepo({
    companyId: input.companyId,
    vehicleId: input.vehicleId ?? null,
    dateFrom: input.dateFrom ?? null,
    dateTo: input.dateTo ?? null,
    limit,
  });

  const rows = await Promise.all(
    trips.map(async (trip) => {
      if (!trip.startedAt || !trip.endedAt) return null;

      const distanceKm =
        typeof trip.startOdometerKm === 'number' && typeof trip.endOdometerKm === 'number'
          ? Math.max(0, trip.endOdometerKm - trip.startOdometerKm)
          : 0;

      const fuelTotals = await sumApprovedFuelLogsForTripWindowRepo({
        companyId: input.companyId,
        vehicleId: trip.vehicleId,
        startedAt: trip.startedAt,
        endedAt: trip.endedAt,
      });

      const benchmarkKmPerLiter = trip.expectedKmPerLiter ?? defaultExpectedKmPerLiter;
      const expectedLiters = distanceKm > 0 ? distanceKm / benchmarkKmPerLiter : 0;
      const actualLiters = fuelTotals.liters;
      const varianceLiters = actualLiters - expectedLiters;
      const variancePct = expectedLiters > 0 ? (varianceLiters / expectedLiters) * 100 : 0;
      const anomaly = expectedLiters > 0 && variancePct > expectedOveruseThresholdPct;
      const costPerKm = distanceKm > 0 ? fuelTotals.fuelCostPsw / distanceKm : null;

      return {
        tripId: trip.id,
        tripNo: trip.tripNo,
        branchId: trip.branchId ?? null,
        branchName: trip.branchName ?? null,
        vehicleId: trip.vehicleId,
        vehiclePlateNumber: trip.vehiclePlateNumber,
        routePlanId: trip.routePlanId ?? null,
        routePlanName: trip.routePlanName ?? null,
        driverEmployeeId: trip.driverEmployeeId ?? null,
        driverEmployeeName: trip.driverEmployeeName ?? null,
        fuelType: trip.fuelType,
        benchmarkKmPerLiter,
        distanceKm,
        expectedLiters,
        actualLiters,
        varianceLiters,
        variancePct,
        fuelCostPsw: fuelTotals.fuelCostPsw,
        costPerKm,
        anomaly,
        approvedFuelLogCount: fuelTotals.logCount,
        plannedStartAt: trip.plannedStartAt,
        plannedEndAt: trip.plannedEndAt,
        startedAt: trip.startedAt,
        endedAt: trip.endedAt,
      };
    }),
  );

  const data = rows.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const anomalyCount = data.filter((item) => item.anomaly).length;
  const totalExpectedLiters = data.reduce((sum, item) => sum + item.expectedLiters, 0);
  const totalActualLiters = data.reduce((sum, item) => sum + item.actualLiters, 0);
  const totalFuelCostPsw = data.reduce((sum, item) => sum + item.fuelCostPsw, 0);
  const totalDistanceKm = data.reduce((sum, item) => sum + item.distanceKm, 0);

  return {
    summary: {
      tripsAnalyzed: data.length,
      anomalyCount,
      totalExpectedLiters,
      totalActualLiters,
      totalVarianceLiters: totalActualLiters - totalExpectedLiters,
      totalFuelCostPsw,
      averageCostPerKm: totalDistanceKm > 0 ? totalFuelCostPsw / totalDistanceKm : null,
    },
    data,
  };
}

export async function getFleetFuelFraudSignalsSvc(input: {
  companyId: string;
  branchId?: string | null;
  vehicleId?: string | null;
  fuelType?: number | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
  expectedOveruseThresholdPct?: number;
  defaultExpectedKmPerLiter?: number;
  highCostPerKmThreshold?: number;
  rapidRefuelHours?: number;
}) {
  const branchAdjustedHighCostPerKm = input.highCostPerKmThreshold ?? (input.branchId ? 2.8 : 3);
  const highCostPerKmThreshold = Math.max(0, branchAdjustedHighCostPerKm);
  const rapidRefuelHours = Math.max(1, Math.min(72, input.rapidRefuelHours ?? 12));
  const analytics = await listFleetFuelAnalyticsSvc({
    companyId: input.companyId,
    vehicleId: input.vehicleId ?? null,
    dateFrom: input.dateFrom ?? null,
    dateTo: input.dateTo ?? null,
    limit: input.limit ?? 200,
    expectedOveruseThresholdPct: input.expectedOveruseThresholdPct ?? 20,
    defaultExpectedKmPerLiter: input.defaultExpectedKmPerLiter ?? 6,
  });

  const filtered = analytics.data.filter((row) => {
    if (input.branchId && row.branchId !== input.branchId) return false;
    if (typeof input.fuelType === 'number' && row.fuelType !== input.fuelType) return false;
    return true;
  });

  const byVehicle = new Map<string, typeof analytics.data>();
  for (const row of filtered) {
    const bucket = byVehicle.get(row.vehicleId) ?? [];
    bucket.push(row);
    byVehicle.set(row.vehicleId, bucket);
  }

  const rapidRefuelTripIds = new Set<string>();
  for (const rows of byVehicle.values()) {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      const gapHours =
        (new Date(cur.startedAt).getTime() - new Date(prev.endedAt).getTime()) / 3_600_000;
      if (Number.isFinite(gapHours) && gapHours >= 0 && gapHours <= rapidRefuelHours) {
        rapidRefuelTripIds.add(prev.tripId);
        rapidRefuelTripIds.add(cur.tripId);
      }
    }
  }

  const data = filtered.map((row) => {
    const highVariance = row.anomaly;
    const fuelTypeBaseThreshold =
      row.fuelType === FleetVehicleFuelType.ELECTRIC
        ? highCostPerKmThreshold * 0.6
        : row.fuelType === FleetVehicleFuelType.HYBRID
          ? highCostPerKmThreshold * 0.8
          : highCostPerKmThreshold;
    const highCostPerKm =
      typeof row.costPerKm === 'number' && row.costPerKm > fuelTypeBaseThreshold;
    const rapidRefuelPattern = rapidRefuelTripIds.has(row.tripId);
    const ruleHits = [highVariance, highCostPerKm, rapidRefuelPattern].filter(Boolean).length;
    const riskLevel =
      ruleHits >= 3 ? 'high' : ruleHits === 2 ? 'medium' : ruleHits === 1 ? 'low' : 'none';
    return {
      ...row,
      riskLevel,
      flags: {
        highVariance,
        highCostPerKm,
        rapidRefuelPattern,
      },
      ruleHits,
      effectiveHighCostPerKmThreshold: fuelTypeBaseThreshold,
    };
  });

  return {
    summary: {
      tripsAnalyzed: data.length,
      flaggedTrips: data.filter((row) => row.ruleHits > 0).length,
      highRiskTrips: data.filter((row) => row.riskLevel === 'high').length,
      mediumRiskTrips: data.filter((row) => row.riskLevel === 'medium').length,
      lowRiskTrips: data.filter((row) => row.riskLevel === 'low').length,
    },
    data,
  };
}

export async function runFleetAnalyticsSnapshotJobSvc(input: {
  companyId: string;
  actorUserId: string;
  windowDays?: number;
  horizonDays?: number;
  defaultExpectedKmPerLiter?: number;
  expectedOveruseThresholdPct?: number;
}) {
  const windowDays = Math.max(30, Math.min(365, input.windowDays ?? 180));
  const horizonDays = Math.max(7, Math.min(365, input.horizonDays ?? 60));
  const [complianceKpis, fraudSignals, unitEconomics, reliability] = await Promise.all([
    getFleetComplianceKpiTrendsSvc({
      companyId: input.companyId,
      windowDays,
    }),
    getFleetFuelFraudSignalsSvc({
      companyId: input.companyId,
      dateFrom: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000),
      dateTo: new Date(),
      expectedOveruseThresholdPct: input.expectedOveruseThresholdPct ?? 20,
      defaultExpectedKmPerLiter: input.defaultExpectedKmPerLiter ?? 6,
      limit: 500,
    }),
    getFleetUnitEconomicsSvc({
      companyId: input.companyId,
      dateFrom: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000),
      dateTo: new Date(),
      expectedOveruseThresholdPct: input.expectedOveruseThresholdPct ?? 20,
      defaultExpectedKmPerLiter: input.defaultExpectedKmPerLiter ?? 6,
    }),
    getFleetMaintenanceReliabilityTrendsSvc({
      companyId: input.companyId,
      windowDays: Math.max(windowDays, horizonDays),
    }),
  ]);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    windowDays,
    horizonDays,
    compliance: complianceKpis.summary,
    fraud: fraudSignals.summary,
    economics: unitEconomics.summary,
    reliability: reliability.summary,
  };

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_analytics',
    entityId: input.companyId,
    action: 'FLEET_ANALYTICS_SNAPSHOT_JOB_TRIGGERED',
    message: 'Fleet analytics snapshot generated',
    metadata: snapshot,
  });

  return snapshot;
}

export async function listFleetFuelLogsSvc(params: ListFleetFuelLogsParams) {
  return listFleetFuelLogsRepo(params);
}

export async function getFleetVehicleSvc(input: { companyId: string; id: string }) {
  const row = await getFleetVehicleByIdRepo(input.companyId, input.id);
  if (!row) throw NotFound('Vehicle not found');
  return row;
}

export async function listFleetVehicleDocumentsSvc(input: {
  companyId: string;
  vehicleId: string;
}) {
  const vehicle = await getFleetVehicleByIdRepo(input.companyId, input.vehicleId);
  if (!vehicle) throw NotFound('Vehicle not found');
  return listFleetVehicleDocumentsRepo(input.companyId, input.vehicleId);
}

export async function createFleetVehicleDocumentSvc(input: {
  companyId: string;
  vehicleId: string;
  createdBy: string;
  documentType: string;
  documentNumber?: string | null;
  issuer?: string | null;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  fileUrl?: string | null;
  note?: string | null;
}) {
  const vehicle = await getFleetVehicleByIdRepo(input.companyId, input.vehicleId);
  if (!vehicle) throw NotFound('Vehicle not found');
  if (input.issuedAt && input.expiresAt && input.expiresAt.getTime() < input.issuedAt.getTime()) {
    throw Conflict('Document expiry cannot be earlier than issue date');
  }

  const created = await createFleetVehicleDocumentRepo({
    companyId: input.companyId,
    vehicleId: input.vehicleId,
    documentType: input.documentType,
    documentNumber: input.documentNumber ?? null,
    issuer: input.issuer ?? null,
    issuedAt: input.issuedAt ?? null,
    expiresAt: input.expiresAt ?? null,
    fileUrl: input.fileUrl ?? null,
    note: input.note ?? null,
    createdBy: input.createdBy,
  });
  if (!created) throw Conflict('Failed to create vehicle document');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'fleet_vehicle',
    entityId: input.vehicleId,
    action: 'FLEET_VEHICLE_DOCUMENT_CREATED',
    message: `Vehicle document added: ${input.documentType}`,
  });

  return created;
}

export async function listFleetVehicleComplianceAlertsSvc(input: {
  companyId: string;
  horizonDays?: number;
  limit?: number;
}) {
  const horizonDays = Math.max(1, Math.min(365, input.horizonDays ?? 30));
  const limit = Math.max(1, Math.min(200, input.limit ?? 50));
  const now = new Date();
  const dueOnOrBefore = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const alerts = await listFleetVehicleComplianceAlertsRepo({
    companyId: input.companyId,
    dueOnOrBefore,
    limit,
  });

  return alerts.map((item) => {
    const dueAt = item.dueAt!;
    const daysUntilDue = Math.ceil((dueAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return {
      ...item,
      dueAt,
      daysUntilDue,
      severity: dueAt.getTime() < now.getTime() ? ('expired' as const) : ('due_soon' as const),
    };
  });
}

export async function listFleetDriverOptionsSvc(input: {
  companyId: string;
  search?: string | null;
}) {
  return listFleetDriverOptionsRepo(input);
}

export async function listFleetDriverComplianceRecordsSvc(input: {
  companyId: string;
  employeeId: string;
}) {
  await assertDriverEmployee(input.companyId, input.employeeId);
  return listFleetDriverComplianceRecordsRepo(input);
}

export async function createFleetDriverComplianceRecordSvc(input: {
  companyId: string;
  employeeId: string;
  createdBy: string;
  complianceType: number;
  documentNumber?: string | null;
  issuer?: string | null;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  fileUrl?: string | null;
  note?: string | null;
}) {
  await assertDriverEmployee(input.companyId, input.employeeId);
  if (input.issuedAt && input.expiresAt && input.expiresAt.getTime() < input.issuedAt.getTime()) {
    throw Conflict('Compliance expiry cannot be earlier than issue date');
  }

  const created = await createFleetDriverComplianceRecordRepo({
    companyId: input.companyId,
    employeeId: input.employeeId,
    complianceType: input.complianceType,
    documentNumber: input.documentNumber ?? null,
    issuer: input.issuer ?? null,
    issuedAt: input.issuedAt ?? null,
    expiresAt: input.expiresAt ?? null,
    fileUrl: input.fileUrl ?? null,
    note: input.note ?? null,
    createdBy: input.createdBy,
  });
  if (!created) throw Conflict('Failed to create driver compliance record');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'fleet_driver_compliance',
    entityId: created.id,
    action: 'FLEET_DRIVER_COMPLIANCE_CREATED',
    message: `Driver compliance record added: ${driverComplianceTypeLabel(input.complianceType)}`,
    metadata: { employeeId: input.employeeId, complianceType: input.complianceType },
  });

  return created;
}

export async function listFleetDriverComplianceAlertsSvc(input: {
  companyId: string;
  horizonDays?: number;
  limit?: number;
}) {
  const horizonDays = Math.max(1, Math.min(365, input.horizonDays ?? 30));
  const limit = Math.max(1, Math.min(200, input.limit ?? 50));
  const now = new Date();
  const dueOnOrBefore = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const alerts = await listFleetDriverComplianceAlertsRepo({
    companyId: input.companyId,
    dueOnOrBefore,
    limit,
  });

  return alerts.map((item) => {
    const dueAt = item.dueAt!;
    const daysUntilDue = Math.ceil((dueAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return {
      ...item,
      dueAt,
      label: driverComplianceTypeLabel(item.complianceType),
      severity: dueAt.getTime() < now.getTime() ? ('expired' as const) : ('due_soon' as const),
      daysUntilDue,
    };
  });
}

export async function listFleetComplianceDashboardSvc(input: {
  companyId: string;
  horizonDays?: number;
  limit?: number;
  branchId?: string | null;
  status?: 'all' | 'expired' | 'due_7' | 'due_30' | 'due_60';
}) {
  const horizonDays = Math.max(1, Math.min(365, input.horizonDays ?? 60));
  const limit = Math.max(1, Math.min(500, input.limit ?? 200));
  const status = input.status ?? 'all';
  const now = new Date();
  const dueOnOrBefore = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const [alerts, kpis] = await Promise.all([
    listFleetComplianceDashboardAlertsRepo({
      companyId: input.companyId,
      dueOnOrBefore,
      limit,
      branchId: input.branchId ?? null,
    }),
    getFleetComplianceKpiRepo(input.companyId),
  ]);

  const normalized = alerts.map((item) => {
    const dueAt = item.dueAt!;
    const daysUntilDue = Math.ceil((dueAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const lifecycleStatus = complianceDashboardStatus(daysUntilDue);
    return {
      id: `${item.kind}:${item.sourceRef}`,
      kind: item.kind,
      alertType: item.alertType,
      sourceRef: item.sourceRef,
      branchId: item.branchId ?? null,
      branchName: item.branchName ?? null,
      dueAt,
      daysUntilDue,
      status: lifecycleStatus,
      severity: lifecycleStatus === 'expired' ? ('expired' as const) : ('due_soon' as const),
      label:
        item.kind === 'driver' && typeof item.complianceType === 'number'
          ? driverComplianceTypeLabel(item.complianceType)
          : item.label,
      vehicleId: item.vehicleId ?? null,
      plateNumber: item.plateNumber ?? null,
      model: item.model ?? null,
      employeeId: item.employeeId ?? null,
      employeeNumber: item.employeeNumber ?? null,
      employeeName: item.employeeName ?? null,
    };
  });

  const data = normalized
    .filter((item) => matchesComplianceStatusFilter(item.status, status))
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, limit);

  const summary = {
    total: data.length,
    expired: data.filter((item) => item.status === 'expired').length,
    dueIn7Days: data.filter((item) => item.status === 'due_7').length,
    dueIn30Days: data.filter((item) => item.status === 'due_7' || item.status === 'due_30').length,
    dueIn60Days: data.filter((item) => item.status !== 'expired').length,
    vehicleAlerts: data.filter((item) => item.kind === 'vehicle').length,
    driverAlerts: data.filter((item) => item.kind === 'driver').length,
    openIncidents: kpis.openIncidents,
    criticalOpenIncidents: kpis.criticalOpenIncidents,
    openViolations: kpis.openViolations,
    openAccidents: kpis.openAccidents,
    revokedPolicies: kpis.revokedPolicies,
  };

  return { summary, data };
}

export async function getFleetComplianceKpiTrendsSvc(input: {
  companyId: string;
  windowDays?: number;
}) {
  const windowDays = Math.max(30, Math.min(365, input.windowDays ?? 180));
  const now = Date.now();
  const windowStart = new Date(now - windowDays * 24 * 60 * 60 * 1000);
  const incidents = await listFleetComplianceIncidentsRepo({
    companyId: input.companyId,
    limit: 5000,
    offset: 0,
  });
  const acks = await listFleetPolicyAcknowledgmentsRepo({
    companyId: input.companyId,
    limit: 5000,
    offset: 0,
  });

  const scopedIncidents = incidents.data.filter((row) => row.occurredAt >= windowStart);
  const scopedAcks = acks.data.filter((row) => row.acknowledgedAt >= windowStart);

  const monthlyIncidentsMap = new Map<
    string,
    { month: string; total: number; open: number; critical: number; resolvedWithin48h: number }
  >();
  for (const row of scopedIncidents) {
    const month = row.occurredAt.toISOString().slice(0, 7);
    const bucket = monthlyIncidentsMap.get(month) ?? {
      month,
      total: 0,
      open: 0,
      critical: 0,
      resolvedWithin48h: 0,
    };
    bucket.total += 1;
    if (!row.resolvedAt) bucket.open += 1;
    if (row.severity === FleetComplianceIncidentSeverity.CRITICAL) bucket.critical += 1;
    if (row.resolvedAt) {
      const hours = (row.resolvedAt.getTime() - row.occurredAt.getTime()) / 3_600_000;
      if (Number.isFinite(hours) && hours >= 0 && hours <= 48) bucket.resolvedWithin48h += 1;
    }
    monthlyIncidentsMap.set(month, bucket);
  }

  const incidentAging = { d0to2: 0, d3to7: 0, d8to14: 0, d15plus: 0 };
  for (const row of scopedIncidents) {
    if (row.resolvedAt) continue;
    const ageDays = Math.floor((now - row.occurredAt.getTime()) / (24 * 60 * 60 * 1000));
    if (ageDays <= 2) incidentAging.d0to2 += 1;
    else if (ageDays <= 7) incidentAging.d3to7 += 1;
    else if (ageDays <= 14) incidentAging.d8to14 += 1;
    else incidentAging.d15plus += 1;
  }

  const monthlyPolicyAcksMap = new Map<
    string,
    { month: string; total: number; acknowledged: number; pending: number; revoked: number }
  >();
  for (const row of scopedAcks) {
    const month = row.acknowledgedAt.toISOString().slice(0, 7);
    const bucket = monthlyPolicyAcksMap.get(month) ?? {
      month,
      total: 0,
      acknowledged: 0,
      pending: 0,
      revoked: 0,
    };
    bucket.total += 1;
    if (row.status === FleetPolicyAckStatus.ACKNOWLEDGED) bucket.acknowledged += 1;
    if (row.status === FleetPolicyAckStatus.REVOKED) bucket.revoked += 1;
    monthlyPolicyAcksMap.set(month, bucket);
  }

  const monthlyIncidents = Array.from(monthlyIncidentsMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
    .map((row) => ({
      ...row,
      openRatePct: row.total > 0 ? (row.open / row.total) * 100 : 0,
      criticalRatePct: row.total > 0 ? (row.critical / row.total) * 100 : 0,
      resolvedWithin48hPct: row.total > 0 ? (row.resolvedWithin48h / row.total) * 100 : 0,
    }));

  const monthlyPolicyAcks = Array.from(monthlyPolicyAcksMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
    .map((row) => ({
      ...row,
      acknowledgmentRatePct: row.total > 0 ? (row.acknowledged / row.total) * 100 : 0,
      pendingRatePct: row.total > 0 ? (row.pending / row.total) * 100 : 0,
      revokedRatePct: row.total > 0 ? (row.revoked / row.total) * 100 : 0,
    }));

  return {
    summary: {
      windowDays,
      incidentsInWindow: scopedIncidents.length,
      openIncidents: scopedIncidents.filter((row) => !row.resolvedAt).length,
      criticalIncidents: scopedIncidents.filter(
        (row) => row.severity === FleetComplianceIncidentSeverity.CRITICAL,
      ).length,
      policyAcksInWindow: scopedAcks.length,
      pendingPolicyAcks: 0,
      revokedPolicyAcks: scopedAcks.filter((row) => row.status === FleetPolicyAckStatus.REVOKED)
        .length,
    },
    incidentAging,
    monthlyIncidents,
    monthlyPolicyAcks,
  };
}

function buildComplianceDigestBody(input: {
  companyName?: string | null;
  dashboard: Awaited<ReturnType<typeof listFleetComplianceDashboardSvc>>;
  horizonDays: number;
}) {
  const lines = [
    `Fleet compliance alert digest (${input.horizonDays} day window)`,
    input.companyName ? `Company: ${input.companyName}` : '',
    `Total alerts: ${input.dashboard.summary.total}`,
    `Expired: ${input.dashboard.summary.expired}`,
    `Due in 7 days: ${input.dashboard.summary.dueIn7Days}`,
    `Due in 30 days: ${input.dashboard.summary.dueIn30Days}`,
    `Due in 60 days: ${input.dashboard.summary.dueIn60Days}`,
    '',
    'Top alerts:',
    ...input.dashboard.data.slice(0, 30).map((item) => {
      const who =
        item.kind === 'vehicle'
          ? `${item.plateNumber ?? item.vehicleId ?? 'Vehicle'} (${item.label})`
          : `${item.employeeNumber ?? ''} ${item.employeeName ?? item.employeeId ?? 'Driver'} (${item.label})`;
      const branch = item.branchName ? ` @ ${item.branchName}` : '';
      const due = item.dueAt.toISOString();
      return `- ${who}${branch} due ${due} [${item.status}]`;
    }),
  ].filter(Boolean);

  return lines.join('\n');
}

export async function runFleetComplianceExpiryAlertJobSvc(input: {
  companyId: string;
  actorUserId: string;
  horizonDays?: number;
  recipientLimit?: number;
  maxAlertsInDigest?: number;
}) {
  const horizonDays = Math.max(1, Math.min(365, input.horizonDays ?? 60));
  const recipientLimit = Math.max(1, Math.min(100, input.recipientLimit ?? 20));
  const maxAlertsInDigest = Math.max(1, Math.min(200, input.maxAlertsInDigest ?? 100));

  const dashboard = await listFleetComplianceDashboardSvc({
    companyId: input.companyId,
    horizonDays,
    limit: maxAlertsInDigest,
    status: 'all',
  });

  const recipients = await listFleetComplianceAlertRecipientUsersRepo({
    companyId: input.companyId,
    limit: recipientLimit,
  });

  const subject = `Fleet Compliance Alerts (${dashboard.summary.total})`;
  const body = buildComplianceDigestBody({ dashboard, horizonDays });

  let inAppCreated = 0;
  let emailSent = 0;
  let emailFailed = 0;

  for (const recipient of recipients) {
    await createFleetComplianceAlertDispatchRepo({
      companyId: input.companyId,
      campaignId: null,
      channel: 'in_app',
      recipientType: 'user',
      recipientId: recipient.id,
      recipientName: recipient.fullname,
      recipientAddress: `user:${recipient.id}`,
      subject,
      body,
      status: 'sent',
      attemptCount: 1,
      metadataJson: {
        source: 'fleet_compliance_expiry_job',
        horizonDays,
      },
    });
    inAppCreated += 1;

    const emailDispatch = await createFleetComplianceAlertDispatchRepo({
      companyId: input.companyId,
      campaignId: null,
      channel: 'email',
      recipientType: 'user',
      recipientId: recipient.id,
      recipientName: recipient.fullname,
      recipientAddress: recipient.email,
      subject,
      body,
      status: 'pending',
      attemptCount: 0,
      metadataJson: {
        source: 'fleet_compliance_expiry_job',
        horizonDays,
      },
    });
    if (!emailDispatch) {
      emailFailed += 1;
      continue;
    }

    try {
      const info = await sendMail({
        to: recipient.email,
        subject,
        text: body,
        html: `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${body}</pre>`,
      });
      await updateFleetComplianceAlertDispatchRepo(emailDispatch.id, input.companyId, {
        status: 'sent',
        attemptCount: 1,
        providerMessageId: info.messageId ?? null,
        errorMessage: null,
      });
      emailSent += 1;
    } catch (error) {
      await updateFleetComplianceAlertDispatchRepo(emailDispatch.id, input.companyId, {
        status: 'failed',
        attemptCount: 1,
        errorMessage:
          error instanceof Error ? error.message : 'Failed to send compliance alert email',
      });
      emailFailed += 1;
    }
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_compliance',
    entityId: input.companyId,
    action: 'FLEET_COMPLIANCE_ALERT_JOB_TRIGGERED',
    message: 'Fleet compliance alert digest generated',
    metadata: {
      horizonDays,
      summary: dashboard.summary,
      recipients: recipients.length,
      inAppCreated,
      emailSent,
      emailFailed,
    },
  });

  return {
    dashboardSummary: dashboard.summary,
    recipients: recipients.length,
    inAppCreated,
    emailSent,
    emailFailed,
  };
}

function buildLowStockDigestBody(parts: Awaited<ReturnType<typeof listFleetLowStockPartsRepo>>) {
  const lines = [
    'Fleet low-stock parts digest',
    `Total low-stock parts: ${parts.length}`,
    '',
    ...parts.map(
      (part) =>
        `- ${part.sku} ${part.name}: ${part.qtyOnHand} ${part.unit} (reorder ${part.reorderLevel})`,
    ),
  ];
  return lines.join('\n');
}

export async function runFleetLowStockAlertJobSvc(input: {
  companyId: string;
  actorUserId: string;
  recipientLimit?: number;
  partLimit?: number;
  branchId?: string | null;
}) {
  const recipientLimit = Math.max(1, Math.min(100, input.recipientLimit ?? 20));
  const partLimit = Math.max(1, Math.min(300, input.partLimit ?? 100));
  const parts = await listFleetLowStockPartsRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    limit: partLimit,
  });
  const recipients = await listFleetComplianceAlertRecipientUsersRepo({
    companyId: input.companyId,
    limit: recipientLimit,
  });

  const subject = `Fleet Low Stock Alerts (${parts.length})`;
  const body = buildLowStockDigestBody(parts);
  let inAppCreated = 0;
  let emailSent = 0;
  let emailFailed = 0;

  for (const recipient of recipients) {
    await createFleetComplianceAlertDispatchRepo({
      companyId: input.companyId,
      campaignId: null,
      channel: 'in_app',
      recipientType: 'user',
      recipientId: recipient.id,
      recipientName: recipient.fullname,
      recipientAddress: `user:${recipient.id}`,
      subject,
      body,
      status: 'sent',
      attemptCount: 1,
      metadataJson: { source: 'fleet_low_stock_alert_job' },
    });
    inAppCreated += 1;

    const emailDispatch = await createFleetComplianceAlertDispatchRepo({
      companyId: input.companyId,
      campaignId: null,
      channel: 'email',
      recipientType: 'user',
      recipientId: recipient.id,
      recipientName: recipient.fullname,
      recipientAddress: recipient.email,
      subject,
      body,
      status: 'pending',
      attemptCount: 0,
      metadataJson: { source: 'fleet_low_stock_alert_job' },
    });
    if (!emailDispatch) {
      emailFailed += 1;
      continue;
    }
    try {
      const info = await sendMail({
        to: recipient.email,
        subject,
        text: body,
        html: `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${body}</pre>`,
      });
      await updateFleetComplianceAlertDispatchRepo(emailDispatch.id, input.companyId, {
        status: 'sent',
        attemptCount: 1,
        providerMessageId: info.messageId ?? null,
        errorMessage: null,
      });
      emailSent += 1;
    } catch (error) {
      await updateFleetComplianceAlertDispatchRepo(emailDispatch.id, input.companyId, {
        status: 'failed',
        attemptCount: 1,
        errorMessage: error instanceof Error ? error.message : 'Failed to send low-stock email',
      });
      emailFailed += 1;
    }
  }

  return {
    lowStockParts: parts.length,
    recipients: recipients.length,
    inAppCreated,
    emailSent,
    emailFailed,
  };
}

export async function listFleetLowStockProcurementCandidatesSvc(input: {
  companyId: string;
  branchId?: string | null;
  limit?: number;
  replenishMultiplier?: number;
}) {
  const limit = Math.max(1, Math.min(500, input.limit ?? 100));
  const replenishMultiplier = Math.max(1, Math.min(5, input.replenishMultiplier ?? 1));
  const rows = await listFleetLowStockProcurementCandidatesRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    limit,
  });

  const candidates = rows.map((row) => {
    const suggestedQty = Math.max(1, Math.ceil(row.suggestedQty * replenishMultiplier));
    const suggestedAmountPsw = suggestedQty * row.averageUnitCostPsw;
    return {
      ...row,
      suggestedQty,
      suggestedAmountPsw,
    };
  });

  return {
    summary: {
      totalCandidates: candidates.length,
      totalSuggestedAmountPsw: candidates.reduce((sum, item) => sum + item.suggestedAmountPsw, 0),
    },
    data: candidates,
  };
}

export async function runFleetPolicyReackReminderJobSvc(input: {
  companyId: string;
  actorUserId: string;
  remindAfterDays?: number;
  limit?: number;
}) {
  const policy = await getFleetComplianceEscalationPolicyInternal(input.companyId);
  const remindAfterDays = Math.max(
    1,
    Math.min(3650, input.remindAfterDays ?? policy.policyReackAfterDays),
  );
  const limit = Math.max(1, Math.min(500, input.limit ?? 200));
  const dueOnOrBefore = new Date(Date.now() - remindAfterDays * 24 * 60 * 60 * 1000);
  const targets = await listFleetPolicyReackTargetsRepo({
    companyId: input.companyId,
    dueOnOrBefore,
    limit,
  });

  const grouped = new Map<
    string,
    {
      email: string;
      name: string;
      items: Array<{ policyCode: string; policyVersion: string; acknowledgedAt: Date }>;
    }
  >();
  for (const target of targets) {
    if (!target.userId || !target.userEmail) continue;
    const existing = grouped.get(target.userId) ?? {
      email: target.userEmail,
      name: target.userName ?? 'User',
      items: [],
    };
    existing.items.push({
      policyCode: target.policyCode,
      policyVersion: target.policyVersion,
      acknowledgedAt: target.acknowledgedAt,
    });
    grouped.set(target.userId, existing);
  }

  let inAppCreated = 0;
  let emailSent = 0;
  let emailFailed = 0;

  for (const [userId, item] of grouped.entries()) {
    const subject = `Fleet Policy Re-Acknowledgment Reminder (${item.items.length})`;
    const body = [
      `Your fleet policy acknowledgments are due for renewal (${remindAfterDays}+ days old).`,
      '',
      ...item.items.map(
        (row) =>
          `- ${row.policyCode} ${row.policyVersion} (acknowledged ${row.acknowledgedAt.toISOString()})`,
      ),
    ].join('\n');

    await createFleetComplianceAlertDispatchRepo({
      companyId: input.companyId,
      campaignId: null,
      channel: 'in_app',
      recipientType: 'user',
      recipientId: userId,
      recipientName: item.name,
      recipientAddress: `user:${userId}`,
      subject,
      body,
      status: 'sent',
      attemptCount: 1,
      metadataJson: { source: 'fleet_policy_reack_job', remindAfterDays },
    });
    inAppCreated += 1;

    const emailDispatch = await createFleetComplianceAlertDispatchRepo({
      companyId: input.companyId,
      campaignId: null,
      channel: 'email',
      recipientType: 'user',
      recipientId: userId,
      recipientName: item.name,
      recipientAddress: item.email,
      subject,
      body,
      status: 'pending',
      attemptCount: 0,
      metadataJson: { source: 'fleet_policy_reack_job', remindAfterDays },
    });
    if (!emailDispatch) {
      emailFailed += 1;
      continue;
    }
    try {
      const info = await sendMail({
        to: item.email,
        subject,
        text: body,
        html: `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${body}</pre>`,
      });
      await updateFleetComplianceAlertDispatchRepo(emailDispatch.id, input.companyId, {
        status: 'sent',
        attemptCount: 1,
        providerMessageId: info.messageId ?? null,
        errorMessage: null,
      });
      emailSent += 1;
    } catch (error) {
      await updateFleetComplianceAlertDispatchRepo(emailDispatch.id, input.companyId, {
        status: 'failed',
        attemptCount: 1,
        errorMessage:
          error instanceof Error ? error.message : 'Failed to send policy reminder email',
      });
      emailFailed += 1;
    }
  }

  return {
    candidates: targets.length,
    recipients: grouped.size,
    inAppCreated,
    emailSent,
    emailFailed,
  };
}

type FleetComplianceEscalationPolicy = {
  incidentEscalateAfterDays: number;
  incidentCriticalEscalateAfterDays: number;
  complianceEscalateAfterDays: number;
  policyReackAfterDays: number;
  incidentLimit: number;
  recipientLimit: number;
};

const DEFAULT_FLEET_COMPLIANCE_ESCALATION_POLICY: FleetComplianceEscalationPolicy = {
  incidentEscalateAfterDays: 3,
  incidentCriticalEscalateAfterDays: 1,
  complianceEscalateAfterDays: 0,
  policyReackAfterDays: 365,
  incidentLimit: 400,
  recipientLimit: 20,
};

function normalizeFleetComplianceEscalationPolicy(raw: unknown): FleetComplianceEscalationPolicy {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    incidentEscalateAfterDays: Math.max(
      1,
      Math.min(
        90,
        typeof input.incidentEscalateAfterDays === 'number'
          ? input.incidentEscalateAfterDays
          : DEFAULT_FLEET_COMPLIANCE_ESCALATION_POLICY.incidentEscalateAfterDays,
      ),
    ),
    incidentCriticalEscalateAfterDays: Math.max(
      1,
      Math.min(
        30,
        typeof input.incidentCriticalEscalateAfterDays === 'number'
          ? input.incidentCriticalEscalateAfterDays
          : DEFAULT_FLEET_COMPLIANCE_ESCALATION_POLICY.incidentCriticalEscalateAfterDays,
      ),
    ),
    complianceEscalateAfterDays: Math.max(
      0,
      Math.min(
        90,
        typeof input.complianceEscalateAfterDays === 'number'
          ? input.complianceEscalateAfterDays
          : DEFAULT_FLEET_COMPLIANCE_ESCALATION_POLICY.complianceEscalateAfterDays,
      ),
    ),
    policyReackAfterDays: Math.max(
      1,
      Math.min(
        3650,
        typeof input.policyReackAfterDays === 'number'
          ? input.policyReackAfterDays
          : DEFAULT_FLEET_COMPLIANCE_ESCALATION_POLICY.policyReackAfterDays,
      ),
    ),
    incidentLimit: Math.max(
      1,
      Math.min(
        1000,
        typeof input.incidentLimit === 'number'
          ? input.incidentLimit
          : DEFAULT_FLEET_COMPLIANCE_ESCALATION_POLICY.incidentLimit,
      ),
    ),
    recipientLimit: Math.max(
      1,
      Math.min(
        100,
        typeof input.recipientLimit === 'number'
          ? input.recipientLimit
          : DEFAULT_FLEET_COMPLIANCE_ESCALATION_POLICY.recipientLimit,
      ),
    ),
  };
}

async function getFleetComplianceEscalationPolicyInternal(companyId: string) {
  const moduleState = await findCompanyModuleRepo(companyId, 'fleet_transport');
  const moduleSettings =
    moduleState?.settings && typeof moduleState.settings === 'object'
      ? (moduleState.settings as Record<string, unknown>)
      : {};
  const rawPolicy = moduleSettings.complianceEscalationPolicy;
  return normalizeFleetComplianceEscalationPolicy(rawPolicy);
}

export async function getFleetComplianceEscalationPolicySvc(input: { companyId: string }) {
  return getFleetComplianceEscalationPolicyInternal(input.companyId);
}

export async function setFleetComplianceEscalationPolicySvc(input: {
  companyId: string;
  actorUserId: string;
  policy: Partial<FleetComplianceEscalationPolicy>;
}) {
  const moduleState = await findCompanyModuleRepo(input.companyId, 'fleet_transport');
  if (!moduleState?.isEnabled) {
    throw Conflict('Fleet transport module is not enabled for this company');
  }
  const baseSettings =
    moduleState.settings && typeof moduleState.settings === 'object'
      ? (moduleState.settings as Record<string, unknown>)
      : {};
  const nextPolicy = normalizeFleetComplianceEscalationPolicy({
    ...baseSettings.complianceEscalationPolicy,
    ...input.policy,
  });
  const nextSettings = {
    ...baseSettings,
    complianceEscalationPolicy: nextPolicy,
  };

  const updated = await updateCompanyModuleSettingsRepo({
    companyId: input.companyId,
    moduleCode: 'fleet_transport',
    configuredBy: input.actorUserId,
    settings: nextSettings,
  });
  if (!updated) throw Conflict('Failed to update compliance escalation policy');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_compliance_policy',
    entityId: updated.id,
    action: 'FLEET_COMPLIANCE_ESCALATION_POLICY_UPDATED',
    message: 'Fleet compliance escalation policy updated',
    metadata: nextPolicy,
  });

  return nextPolicy;
}

export async function runFleetComplianceEscalationJobSvc(input: {
  companyId: string;
  actorUserId: string;
  incidentEscalateAfterDays?: number;
  incidentCriticalEscalateAfterDays?: number;
  complianceEscalateAfterDays?: number;
  incidentLimit?: number;
  recipientLimit?: number;
}) {
  const policy = await getFleetComplianceEscalationPolicyInternal(input.companyId);
  const incidentEscalateAfterDays = Math.max(
    1,
    Math.min(90, input.incidentEscalateAfterDays ?? policy.incidentEscalateAfterDays),
  );
  const incidentCriticalEscalateAfterDays = Math.max(
    1,
    Math.min(
      30,
      input.incidentCriticalEscalateAfterDays ?? policy.incidentCriticalEscalateAfterDays,
    ),
  );
  const complianceEscalateAfterDays = Math.max(
    0,
    Math.min(90, input.complianceEscalateAfterDays ?? policy.complianceEscalateAfterDays),
  );
  const incidentLimit = Math.max(1, Math.min(1000, input.incidentLimit ?? policy.incidentLimit));
  const recipientLimit = Math.max(1, Math.min(100, input.recipientLimit ?? policy.recipientLimit));
  const now = new Date();

  const [incidents, complianceDashboard, recipients] = await Promise.all([
    listOpenFleetComplianceIncidentsForEscalationRepo({
      companyId: input.companyId,
      occurredOnOrBefore: null,
      limit: incidentLimit,
    }),
    listFleetComplianceDashboardSvc({
      companyId: input.companyId,
      status: 'expired',
      horizonDays: 365,
      limit: incidentLimit,
    }),
    listFleetComplianceAlertRecipientUsersRepo({
      companyId: input.companyId,
      limit: recipientLimit,
    }),
  ]);

  const incidentEscalations = incidents
    .map((item) => {
      const daysOpen = Math.max(
        0,
        Math.ceil((now.getTime() - item.occurredAt.getTime()) / (24 * 60 * 60 * 1000)),
      );
      const threshold =
        item.severity === FleetComplianceIncidentSeverity.CRITICAL
          ? incidentCriticalEscalateAfterDays
          : incidentEscalateAfterDays;
      if (daysOpen < threshold) return null;

      const tier = daysOpen >= threshold * 3 ? 3 : daysOpen >= threshold * 2 ? 2 : 1;
      return {
        id: item.id,
        incidentType: item.incidentType,
        severity: item.severity,
        occurredAt: item.occurredAt,
        daysOpen,
        tier,
        description: item.description,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.tier - a.tier || b.severity - a.severity || b.daysOpen - a.daysOpen);

  const complianceEscalations = complianceDashboard.data
    .map((item) => {
      const daysOverdue = Math.max(0, Math.abs(Math.min(item.daysUntilDue, 0)));
      if (daysOverdue < complianceEscalateAfterDays) return null;
      const tier = daysOverdue >= 30 ? 3 : daysOverdue >= 14 ? 2 : 1;
      return {
        id: item.id,
        kind: item.kind,
        label: item.label,
        dueAt: item.dueAt,
        daysOverdue,
        tier,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.tier - a.tier || b.daysOverdue - a.daysOverdue);

  const subject = `Fleet Compliance Escalations (${incidentEscalations.length + complianceEscalations.length})`;
  const body = [
    'Fleet compliance escalation digest',
    `Generated at: ${now.toISOString()}`,
    '',
    `Open incident escalations: ${incidentEscalations.length}`,
    ...incidentEscalations
      .slice(0, 50)
      .map(
        (item) =>
          `- [Tier ${item.tier}] Incident ${item.id} (type ${item.incidentType}, severity ${item.severity}) open ${item.daysOpen} day(s), occurred ${item.occurredAt.toISOString()}`,
      ),
    '',
    `Overdue compliance escalations: ${complianceEscalations.length}`,
    ...complianceEscalations
      .slice(0, 50)
      .map(
        (item) =>
          `- [Tier ${item.tier}] ${item.label} (${item.kind}) overdue ${item.daysOverdue} day(s), due ${item.dueAt.toISOString()}`,
      ),
  ].join('\n');

  let inAppCreated = 0;
  let emailSent = 0;
  let emailFailed = 0;

  if (incidentEscalations.length > 0 || complianceEscalations.length > 0) {
    for (const recipient of recipients) {
      await createFleetComplianceAlertDispatchRepo({
        companyId: input.companyId,
        campaignId: null,
        channel: 'in_app',
        recipientType: 'user',
        recipientId: recipient.id,
        recipientName: recipient.fullname,
        recipientAddress: `user:${recipient.id}`,
        subject,
        body,
        status: 'sent',
        attemptCount: 1,
        metadataJson: {
          source: 'fleet_compliance_escalation_job',
          incidentEscalations: incidentEscalations.length,
          complianceEscalations: complianceEscalations.length,
        },
      });
      inAppCreated += 1;

      const emailDispatch = await createFleetComplianceAlertDispatchRepo({
        companyId: input.companyId,
        campaignId: null,
        channel: 'email',
        recipientType: 'user',
        recipientId: recipient.id,
        recipientName: recipient.fullname,
        recipientAddress: recipient.email,
        subject,
        body,
        status: 'pending',
        attemptCount: 0,
        metadataJson: {
          source: 'fleet_compliance_escalation_job',
          incidentEscalations: incidentEscalations.length,
          complianceEscalations: complianceEscalations.length,
        },
      });
      if (!emailDispatch) {
        emailFailed += 1;
        continue;
      }
      try {
        const info = await sendMail({
          to: recipient.email,
          subject,
          text: body,
          html: `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${body}</pre>`,
        });
        await updateFleetComplianceAlertDispatchRepo(emailDispatch.id, input.companyId, {
          status: 'sent',
          attemptCount: 1,
          providerMessageId: info.messageId ?? null,
          errorMessage: null,
        });
        emailSent += 1;
      } catch (error) {
        await updateFleetComplianceAlertDispatchRepo(emailDispatch.id, input.companyId, {
          status: 'failed',
          attemptCount: 1,
          errorMessage: error instanceof Error ? error.message : 'Failed to send escalation email',
        });
        emailFailed += 1;
      }
    }
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_compliance',
    entityId: input.companyId,
    action: 'FLEET_COMPLIANCE_ESCALATION_JOB_TRIGGERED',
    message: 'Fleet compliance escalation job executed',
    metadata: {
      incidentEscalations: incidentEscalations.length,
      complianceEscalations: complianceEscalations.length,
      inAppCreated,
      emailSent,
      emailFailed,
    },
  });

  return {
    incidentEscalations: incidentEscalations.length,
    complianceEscalations: complianceEscalations.length,
    recipients: recipients.length,
    inAppCreated,
    emailSent,
    emailFailed,
  };
}

export async function runFleetMaintenanceAutomationJobSvc(input: {
  companyId: string;
  actorUserId: string;
  dueWithinDays?: number;
  planLimit?: number;
  autoCreateWorkOrders?: boolean;
  autoCreateProcurementDemands?: boolean;
  lowStockLimit?: number;
  replenishMultiplier?: number;
}) {
  const dueWithinDays = Math.max(0, Math.min(60, input.dueWithinDays ?? 0));
  const planLimit = Math.max(1, Math.min(1000, input.planLimit ?? 400));
  const lowStockLimit = Math.max(1, Math.min(1000, input.lowStockLimit ?? 200));
  const replenishMultiplier = Math.max(1, Math.min(5, input.replenishMultiplier ?? 1));
  const autoCreateWorkOrders = input.autoCreateWorkOrders ?? true;
  const autoCreateProcurementDemands = input.autoCreateProcurementDemands ?? true;
  const now = new Date();
  const dueOnOrBefore = new Date(now.getTime() + dueWithinDays * 24 * 60 * 60 * 1000);

  let scannedPlans = 0;
  let autoWorkOrdersCreated = 0;
  let autoPlansRescheduled = 0;
  const workOrderIds: string[] = [];

  if (autoCreateWorkOrders) {
    const plans = await listFleetMaintenancePlansRepo({
      companyId: input.companyId,
      isActive: true,
    });
    const duePlans = plans
      .filter((plan) => plan.nextDueAt && plan.nextDueAt.getTime() <= dueOnOrBefore.getTime())
      .slice(0, planLimit);
    scannedPlans = duePlans.length;

    for (const plan of duePlans) {
      const existing = await findOpenWorkOrderByPlanRepo(input.companyId, plan.id);
      if (existing) continue;

      const created = await createFleetMaintenanceWorkOrderRepo({
        companyId: input.companyId,
        vehicleId: plan.vehicleId,
        planId: plan.id,
        workOrderNo: buildWorkOrderNo(),
        title: `Auto PM: ${plan.title}`,
        description: `Auto-generated from maintenance plan ${plan.id}`,
        status: FleetMaintenanceWorkOrderStatus.OPEN,
        estimatedCostPsw: 0,
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      });
      if (!created) continue;
      autoWorkOrdersCreated += 1;
      workOrderIds.push(created.id);

      if (
        plan.nextDueAt &&
        (plan.intervalUnit === FleetMaintenanceIntervalUnit.DAYS ||
          plan.intervalUnit === FleetMaintenanceIntervalUnit.WEEKS ||
          plan.intervalUnit === FleetMaintenanceIntervalUnit.MONTHS)
      ) {
        const nextDueAt = addPlanInterval(plan.nextDueAt, plan.intervalUnit, plan.intervalValue);
        await updateFleetMaintenancePlanRepo(plan.id, input.companyId, {
          nextDueAt,
          updatedAt: now,
        });
        autoPlansRescheduled += 1;
      }
    }
  }

  let lowStockCandidates = 0;
  let procurementDemandsCreated = 0;
  const procurementDemandIds: string[] = [];

  if (autoCreateProcurementDemands) {
    const candidates = await listFleetLowStockProcurementCandidatesRepo({
      companyId: input.companyId,
      limit: lowStockLimit,
      branchId: null,
    });
    lowStockCandidates = candidates.length;

    for (const item of candidates) {
      const policy = await findProcurementFleetPolicyByBranchRepo(
        input.companyId,
        item.branchId ?? null,
      );
      const effectiveMultiplier = Math.max(
        1,
        Math.min(5, Number(policy?.replenishMultiplier ?? replenishMultiplier)),
      );
      const suggestedQty = Math.max(1, Math.ceil(item.suggestedQty * effectiveMultiplier));
      const dedupeKey = [
        'fleet_part_reorder',
        input.companyId,
        item.partId,
        item.branchId ?? 'global',
      ].join(':');
      const existingDemand = await findOpenProcurementDemandByDedupeKeyRepo(
        input.companyId,
        dedupeKey,
      );
      if (existingDemand) continue;

      const urgency = policy?.demandUrgency ?? ProcurementDemandUrgency.NORMAL;
      const created = await createProcurementDemandRepo({
        companyId: input.companyId,
        branchId: item.branchId ?? null,
        demandNo: buildDemandNo(),
        sourceModule: 'fleet_transport',
        sourceEntityType: 'fleet_maintenance_part',
        sourceEntityId: item.partId,
        dedupeKey,
        itemCode: item.sku,
        itemName: item.name,
        unit: item.unit,
        quantity: suggestedQty,
        estimatedUnitCostPsw: item.averageUnitCostPsw,
        estimatedTotalPsw: item.averageUnitCostPsw * suggestedQty,
        urgency,
        neededBy: null,
        status: ProcurementDemandStatus.OPEN,
        note: `Auto-created from maintenance automation low-stock trigger`,
        metadataJson: JSON.stringify({
          source: 'fleet_maintenance_automation_job',
          preferredSupplierId: policy?.preferredSupplierId ?? null,
          procurementPolicyId: policy?.id ?? null,
          replenishMultiplier: effectiveMultiplier,
          qtyOnHand: item.qtyOnHand,
          reorderLevel: item.reorderLevel,
        }),
        requestedByUserId: input.actorUserId,
      });
      if (!created) continue;
      procurementDemandsCreated += 1;
      procurementDemandIds.push(created.id);
    }
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_maintenance',
    entityId: input.companyId,
    action: 'FLEET_MAINTENANCE_AUTOMATION_JOB_TRIGGERED',
    message: 'Fleet maintenance automation job executed',
    metadata: {
      dueWithinDays,
      scannedPlans,
      autoWorkOrdersCreated,
      autoPlansRescheduled,
      lowStockCandidates,
      procurementDemandsCreated,
    },
  });

  return {
    dueWithinDays,
    scannedPlans,
    autoWorkOrdersCreated,
    autoPlansRescheduled,
    workOrderIds,
    lowStockCandidates,
    procurementDemandsCreated,
    procurementDemandIds,
  };
}

export async function getFleetOpsQueueSvc(input: {
  companyId: string;
  horizonDays?: number;
  incidentLimit?: number;
  workOrderLimit?: number;
  downtimeLimit?: number;
  lowStockLimit?: number;
  policyReackAfterDays?: number;
}) {
  const horizonDays = Math.max(1, Math.min(365, input.horizonDays ?? 30));
  const incidentLimit = Math.max(1, Math.min(500, input.incidentLimit ?? 50));
  const workOrderLimit = Math.max(1, Math.min(500, input.workOrderLimit ?? 50));
  const downtimeLimit = Math.max(1, Math.min(500, input.downtimeLimit ?? 50));
  const lowStockLimit = Math.max(1, Math.min(500, input.lowStockLimit ?? 50));
  const policyReackAfterDays = Math.max(1, Math.min(3650, input.policyReackAfterDays ?? 365));

  const [
    complianceDashboard,
    kpis,
    incidents,
    openWorkOrders,
    inProgressWorkOrders,
    downtime,
    lowStock,
    reack,
  ] = await Promise.all([
    listFleetComplianceDashboardSvc({
      companyId: input.companyId,
      horizonDays,
      limit: 500,
      status: 'all',
    }),
    getFleetComplianceKpiRepo(input.companyId),
    listOpenFleetComplianceIncidentsForEscalationRepo({
      companyId: input.companyId,
      occurredOnOrBefore: null,
      limit: incidentLimit,
    }),
    listFleetMaintenanceWorkOrdersRepo({
      companyId: input.companyId,
      status: FleetMaintenanceWorkOrderStatus.OPEN,
    }),
    listFleetMaintenanceWorkOrdersRepo({
      companyId: input.companyId,
      status: FleetMaintenanceWorkOrderStatus.IN_PROGRESS,
    }),
    listFleetDowntimeEventsRepo({
      companyId: input.companyId,
      openOnly: true,
    }),
    listFleetLowStockProcurementCandidatesSvc({
      companyId: input.companyId,
      limit: lowStockLimit,
    }),
    listFleetPolicyReackTargetsRepo({
      companyId: input.companyId,
      dueOnOrBefore: new Date(Date.now() - policyReackAfterDays * 24 * 60 * 60 * 1000),
      limit: 500,
    }),
  ]);

  return {
    summary: {
      complianceExpired: complianceDashboard.summary.expired,
      complianceDueIn7Days: complianceDashboard.summary.dueIn7Days,
      openIncidents: kpis.openIncidents,
      criticalOpenIncidents: kpis.criticalOpenIncidents,
      openWorkOrders: openWorkOrders.length,
      inProgressWorkOrders: inProgressWorkOrders.length,
      activeDowntime: downtime.slice(0, downtimeLimit).length,
      lowStockCandidates: lowStock.summary.totalCandidates,
      policyReackDue: reack.length,
      needsImmediateAction:
        kpis.criticalOpenIncidents +
        complianceDashboard.summary.expired +
        openWorkOrders.length +
        downtime.filter((row) => !row.endedAt).length,
    },
    queues: {
      complianceAlerts: complianceDashboard.data
        .filter((item) => item.status === 'expired' || item.status === 'due_7')
        .slice(0, 100),
      incidents: incidents.slice(0, incidentLimit).map((item) => ({
        ...item,
        occurredAt: item.occurredAt,
      })),
      workOrders: [...openWorkOrders, ...inProgressWorkOrders].slice(0, workOrderLimit),
      downtime: downtime.slice(0, downtimeLimit),
      lowStockCandidates: lowStock.data.slice(0, lowStockLimit),
      policyReackTargets: reack,
    },
  };
}

export async function runFleetAutomationOrchestrationJobSvc(input: {
  companyId: string;
  actorUserId: string;
  lifecycleLimit?: number;
  dueWithinDays?: number;
  planLimit?: number;
  incidentEscalateAfterDays?: number;
  incidentCriticalEscalateAfterDays?: number;
  complianceEscalateAfterDays?: number;
  incidentLimit?: number;
  recipientLimit?: number;
  autoCreateProcurementDemands?: boolean;
  lowStockLimit?: number;
  replenishMultiplier?: number;
}) {
  const lifecycle = await runFleetVehicleLifecycleAutomationJobSvc({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    limit: input.lifecycleLimit ?? 300,
  });

  const [maintenance, escalation] = await Promise.all([
    runFleetMaintenanceAutomationJobSvc({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      dueWithinDays: input.dueWithinDays ?? 0,
      planLimit: input.planLimit ?? 400,
      autoCreateWorkOrders: true,
      autoCreateProcurementDemands: input.autoCreateProcurementDemands ?? true,
      lowStockLimit: input.lowStockLimit ?? 200,
      replenishMultiplier: input.replenishMultiplier ?? 1,
    }),
    runFleetComplianceEscalationJobSvc({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      incidentEscalateAfterDays: input.incidentEscalateAfterDays ?? 3,
      incidentCriticalEscalateAfterDays: input.incidentCriticalEscalateAfterDays ?? 1,
      complianceEscalateAfterDays: input.complianceEscalateAfterDays ?? 0,
      incidentLimit: input.incidentLimit ?? 400,
      recipientLimit: input.recipientLimit ?? 20,
    }),
  ]);

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_automation',
    entityId: input.companyId,
    action: 'FLEET_AUTOMATION_ORCHESTRATION_TRIGGERED',
    message: 'Fleet automation orchestration run completed',
    metadata: {
      lifecycle,
      maintenance,
      escalation,
    },
  });

  return { lifecycle, maintenance, escalation };
}

export async function listFleetMaintenancePlansSvc(params: ListFleetMaintenancePlansParams) {
  return listFleetMaintenancePlansRepo(params);
}

export async function createFleetMaintenancePlanSvc(input: {
  companyId: string;
  createdBy: string;
  vehicleId: string;
  title: string;
  description?: string | null;
  intervalUnit: number;
  intervalValue: number;
  lastServiceAt?: Date | null;
  lastServiceOdometerKm?: number | null;
  nextDueAt?: Date | null;
  nextDueOdometerKm?: number | null;
  isActive?: boolean;
}) {
  const vehicle = await getFleetVehicleByIdRepo(input.companyId, input.vehicleId);
  if (!vehicle) throw NotFound('Vehicle not found');
  if (input.intervalValue <= 0) throw Conflict('Interval value must be greater than zero');

  const created = await createFleetMaintenancePlanRepo({
    companyId: input.companyId,
    vehicleId: input.vehicleId,
    title: input.title,
    description: input.description ?? null,
    intervalUnit: input.intervalUnit,
    intervalValue: input.intervalValue,
    lastServiceAt: input.lastServiceAt ?? null,
    lastServiceOdometerKm: input.lastServiceOdometerKm ?? null,
    nextDueAt: input.nextDueAt ?? null,
    nextDueOdometerKm: input.nextDueOdometerKm ?? null,
    isActive: input.isActive ?? true,
    createdBy: input.createdBy,
  });
  if (!created) throw Conflict('Failed to create maintenance plan');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'fleet_maintenance_plan',
    entityId: created.id,
    action: 'FLEET_MAINTENANCE_PLAN_CREATED',
    message: `Maintenance plan created: ${input.title}`,
    metadata: { vehicleId: input.vehicleId },
  });

  return created;
}

export async function updateFleetMaintenancePlanSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    title?: string;
    description?: string | null;
    intervalUnit?: number;
    intervalValue?: number;
    lastServiceAt?: Date | null;
    lastServiceOdometerKm?: number | null;
    nextDueAt?: Date | null;
    nextDueOdometerKm?: number | null;
    isActive?: boolean;
  };
}) {
  if (typeof input.patch.intervalValue === 'number' && input.patch.intervalValue <= 0) {
    throw Conflict('Interval value must be greater than zero');
  }

  const updated = await updateFleetMaintenancePlanRepo(input.id, input.companyId, input.patch);
  if (!updated) throw NotFound('Maintenance plan not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_maintenance_plan',
    entityId: input.id,
    action: 'FLEET_MAINTENANCE_PLAN_UPDATED',
    message: 'Maintenance plan updated',
    metadata: { patch: input.patch },
  });

  return updated;
}

export async function listFleetMaintenanceWorkOrdersSvc(
  params: ListFleetMaintenanceWorkOrdersParams,
) {
  return listFleetMaintenanceWorkOrdersRepo(params);
}

export async function createFleetMaintenanceWorkOrderSvc(input: {
  companyId: string;
  actorUserId: string;
  vehicleId: string;
  planId?: string | null;
  title: string;
  description?: string | null;
  estimatedCostPsw?: number;
}) {
  const vehicle = await getFleetVehicleByIdRepo(input.companyId, input.vehicleId);
  if (!vehicle) throw NotFound('Vehicle not found');

  if (input.planId) {
    const plan = await getFleetMaintenancePlanByIdRepo(input.planId, input.companyId);
    if (!plan || plan.vehicleId !== input.vehicleId) {
      throw Conflict('Maintenance plan does not belong to selected vehicle');
    }
  }

  const created = await createFleetMaintenanceWorkOrderRepo({
    companyId: input.companyId,
    vehicleId: input.vehicleId,
    planId: input.planId ?? null,
    workOrderNo: buildWorkOrderNo(),
    title: input.title,
    description: input.description ?? null,
    status: FleetMaintenanceWorkOrderStatus.OPEN,
    estimatedCostPsw: input.estimatedCostPsw ?? 0,
    createdBy: input.actorUserId,
    updatedBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create maintenance work order');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_maintenance_work_order',
    entityId: created.id,
    action: 'FLEET_MAINTENANCE_WORK_ORDER_CREATED',
    message: `Maintenance work order created: ${input.title}`,
    metadata: { vehicleId: input.vehicleId, planId: input.planId ?? null },
  });

  return created;
}

export async function updateFleetMaintenanceWorkOrderSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    title?: string;
    description?: string | null;
    status?: number;
    startedOdometerKm?: number | null;
    completedOdometerKm?: number | null;
    actualCostPsw?: number;
  };
}) {
  const existing = await getFleetMaintenanceWorkOrderByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Maintenance work order not found');
  if (
    existing.status === FleetMaintenanceWorkOrderStatus.COMPLETED ||
    existing.status === FleetMaintenanceWorkOrderStatus.CANCELLED
  ) {
    throw Conflict('Completed or cancelled work orders cannot be modified');
  }

  if (
    typeof input.patch.status === 'number' &&
    input.patch.status === FleetMaintenanceWorkOrderStatus.COMPLETED
  ) {
    const completedOdometer = input.patch.completedOdometerKm ?? existing.startedOdometerKm;
    if (
      typeof existing.startedOdometerKm === 'number' &&
      typeof completedOdometer === 'number' &&
      completedOdometer < existing.startedOdometerKm
    ) {
      throw Conflict('Completed odometer cannot be less than started odometer');
    }
  }

  const now = new Date();
  const nextPatch: Partial<typeof fleetMaintenanceWorkOrders.$inferInsert> = {
    ...input.patch,
    updatedBy: input.actorUserId,
    updatedAt: now,
  };
  if (
    typeof input.patch.status === 'number' &&
    input.patch.status === FleetMaintenanceWorkOrderStatus.IN_PROGRESS &&
    !existing.startedAt
  ) {
    nextPatch.startedAt = now;
  }
  if (
    typeof input.patch.status === 'number' &&
    input.patch.status === FleetMaintenanceWorkOrderStatus.COMPLETED
  ) {
    nextPatch.completedAt = now;
  }

  const updated = await updateFleetMaintenanceWorkOrderRepo(input.id, input.companyId, nextPatch);
  if (!updated) throw NotFound('Maintenance work order not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_maintenance_work_order',
    entityId: input.id,
    action: 'FLEET_MAINTENANCE_WORK_ORDER_UPDATED',
    message: `Maintenance work order updated: ${workOrderStatusLabel(input.patch.status ?? existing.status)}`,
    metadata: { patch: input.patch },
  });

  return updated;
}

export async function listFleetDowntimeEventsSvc(params: ListFleetDowntimeEventsParams) {
  return listFleetDowntimeEventsRepo(params);
}

export async function createFleetDowntimeEventSvc(input: {
  companyId: string;
  actorUserId: string;
  vehicleId: string;
  workOrderId?: string | null;
  reason: string;
  note?: string | null;
  startedAt?: Date | null;
}) {
  const vehicle = await getFleetVehicleByIdRepo(input.companyId, input.vehicleId);
  if (!vehicle) throw NotFound('Vehicle not found');

  if (input.workOrderId) {
    const workOrder = await getFleetMaintenanceWorkOrderByIdRepo(
      input.workOrderId,
      input.companyId,
    );
    if (!workOrder || workOrder.vehicleId !== input.vehicleId) {
      throw Conflict('Work order does not belong to selected vehicle');
    }
  }

  const openDowntime = await listFleetDowntimeEventsRepo({
    companyId: input.companyId,
    vehicleId: input.vehicleId,
    openOnly: true,
  });
  if (openDowntime.length > 0) {
    throw Conflict('Vehicle already has an active downtime event');
  }

  const created = await createFleetDowntimeEventRepo({
    companyId: input.companyId,
    vehicleId: input.vehicleId,
    workOrderId: input.workOrderId ?? null,
    reason: input.reason,
    note: input.note ?? null,
    startedAt: input.startedAt ?? new Date(),
    createdBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create downtime event');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_downtime',
    entityId: created.id,
    action: 'FLEET_DOWNTIME_OPENED',
    message: `Fleet downtime started: ${input.reason}`,
    metadata: { vehicleId: input.vehicleId, workOrderId: input.workOrderId ?? null },
  });

  return created;
}

export async function closeFleetDowntimeEventSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  endedAt?: Date | null;
  note?: string | null;
}) {
  const existing = await getFleetDowntimeEventByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Downtime event not found');
  if (existing.endedAt) throw Conflict('Downtime event is already closed');

  const endedAt = input.endedAt ?? new Date();
  if (endedAt.getTime() < existing.startedAt.getTime()) {
    throw Conflict('Downtime end time cannot be earlier than start time');
  }

  const closed = await closeFleetDowntimeEventRepo({
    id: input.id,
    companyId: input.companyId,
    closedBy: input.actorUserId,
    endedAt,
    note: input.note ?? null,
  });
  if (!closed) throw NotFound('Downtime event not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_downtime',
    entityId: input.id,
    action: 'FLEET_DOWNTIME_CLOSED',
    message: 'Fleet downtime closed',
  });

  return closed;
}

export async function listFleetDowntimeRcaWorkflowsSvc(input: {
  companyId: string;
  vehicleId?: string | null;
  openOnly?: boolean | null;
  lifecycleStatus?: number | null;
}) {
  const events = await listFleetDowntimeEventsRepo({
    companyId: input.companyId,
    vehicleId: input.vehicleId ?? null,
    openOnly: input.openOnly ?? null,
  });

  const rows = events.map((event) => {
    const workflow = parseDowntimeRcaWorkflow(event.note);
    return {
      ...event,
      workflow,
    };
  });

  if (typeof input.lifecycleStatus !== 'number') return rows;
  return rows.filter((row) => row.workflow.lifecycleStatus === input.lifecycleStatus);
}

export async function updateFleetDowntimeRcaWorkflowSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    reasonCategory?: string | null;
    lifecycleStatus?: number | null;
    rootCause?: string | null;
    correctiveAction?: string | null;
    escalationLevel?: number | null;
  };
}) {
  const event = await getFleetDowntimeEventByIdRepo(input.id, input.companyId);
  if (!event) throw NotFound('Downtime event not found');

  const current = parseDowntimeRcaWorkflow(event.note);
  const next: DowntimeRcaWorkflow = {
    reasonCategory: input.patch.reasonCategory ?? current.reasonCategory,
    lifecycleStatus:
      typeof input.patch.lifecycleStatus === 'number'
        ? input.patch.lifecycleStatus
        : current.lifecycleStatus,
    rootCause: input.patch.rootCause ?? current.rootCause,
    correctiveAction: input.patch.correctiveAction ?? current.correctiveAction,
    escalationLevel:
      typeof input.patch.escalationLevel === 'number'
        ? Math.max(0, input.patch.escalationLevel)
        : current.escalationLevel,
    reopenedCount: current.reopenedCount,
    lastReopenedAt: current.lastReopenedAt,
    updatedAt: new Date().toISOString(),
  };

  const updated = await updateFleetDowntimeEventRepo(input.id, input.companyId, {
    note: buildDowntimeRcaWorkflowNote(next),
  });
  if (!updated) throw NotFound('Downtime event not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_downtime',
    entityId: input.id,
    action: 'FLEET_DOWNTIME_RCA_UPDATED',
    message: 'Fleet downtime RCA workflow updated',
    metadata: {
      lifecycleStatus: next.lifecycleStatus,
      escalationLevel: next.escalationLevel,
      reasonCategory: next.reasonCategory,
    },
  });

  return {
    id: input.id,
    workflow: next,
  };
}

export async function reopenFleetDowntimeEventSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  reason?: string | null;
}) {
  const event = await getFleetDowntimeEventByIdRepo(input.id, input.companyId);
  if (!event) throw NotFound('Downtime event not found');
  if (!event.endedAt) throw Conflict('Downtime event is already active');

  const current = parseDowntimeRcaWorkflow(event.note);
  const next: DowntimeRcaWorkflow = {
    ...current,
    lifecycleStatus: 5, // escalated/reopened
    escalationLevel: Math.max(1, current.escalationLevel + 1),
    reopenedCount: current.reopenedCount + 1,
    lastReopenedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = await updateFleetDowntimeEventRepo(input.id, input.companyId, {
    endedAt: null,
    note: buildDowntimeRcaWorkflowNote(next),
  });
  if (!updated) throw NotFound('Downtime event not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_downtime',
    entityId: input.id,
    action: 'FLEET_DOWNTIME_REOPENED',
    message: `Fleet downtime reopened${input.reason ? `: ${input.reason}` : ''}`,
    metadata: {
      reopenedCount: next.reopenedCount,
      escalationLevel: next.escalationLevel,
      reason: input.reason ?? null,
    },
  });

  return { id: input.id, workflow: next };
}

export async function getFleetMaintenanceKpiDashboardSvc(input: {
  companyId: string;
  windowDays?: number;
  slaHours?: number;
}) {
  const windowDays = Math.max(1, Math.min(365, input.windowDays ?? 30));
  const slaHours = Math.max(1, Math.min(24 * 30, input.slaHours ?? 48));
  const now = Date.now();
  const windowStart = new Date(now - windowDays * 24 * 60 * 60 * 1000);

  const [plans, workOrders, downtime] = await Promise.all([
    listFleetMaintenancePlansRepo({ companyId: input.companyId, isActive: true }),
    listFleetMaintenanceWorkOrdersRepo({ companyId: input.companyId, status: null }),
    listFleetDowntimeEventsRepo({ companyId: input.companyId, openOnly: null }),
  ]);

  const openBacklog = workOrders.filter(
    (row) =>
      row.status === FleetMaintenanceWorkOrderStatus.OPEN ||
      row.status === FleetMaintenanceWorkOrderStatus.IN_PROGRESS,
  );
  const backlogAging = {
    d0to2: 0,
    d3to7: 0,
    d8to14: 0,
    d15plus: 0,
  };
  for (const row of openBacklog) {
    const ageDays = Math.floor((now - row.openedAt.getTime()) / (24 * 60 * 60 * 1000));
    if (ageDays <= 2) backlogAging.d0to2 += 1;
    else if (ageDays <= 7) backlogAging.d3to7 += 1;
    else if (ageDays <= 14) backlogAging.d8to14 += 1;
    else backlogAging.d15plus += 1;
  }

  const duePlans = plans.filter((row) => row.nextDueAt && row.nextDueAt <= new Date(now));
  const preventiveCompleted = workOrders.filter(
    (row) =>
      row.planId &&
      row.status === FleetMaintenanceWorkOrderStatus.COMPLETED &&
      row.completedAt &&
      row.completedAt >= windowStart,
  );
  const preventiveCompliancePct =
    duePlans.length > 0 ? (preventiveCompleted.length / duePlans.length) * 100 : 100;

  const completedInWindow = workOrders.filter(
    (row) =>
      row.status === FleetMaintenanceWorkOrderStatus.COMPLETED &&
      row.completedAt &&
      row.completedAt >= windowStart,
  );
  const slaBreached = completedInWindow.filter(
    (row) => ((row.completedAt?.getTime() ?? 0) - row.openedAt.getTime()) / 3_600_000 > slaHours,
  );
  const slaBreachPct =
    completedInWindow.length > 0 ? (slaBreached.length / completedInWindow.length) * 100 : 0;

  const scheduleDurations = workOrders
    .filter((row) => row.startedAt)
    .map((row) => (row.startedAt!.getTime() - row.openedAt.getTime()) / 3_600_000)
    .filter((value) => value >= 0);
  const meanTimeToScheduleHours =
    scheduleDurations.length > 0
      ? scheduleDurations.reduce((sum, value) => sum + value, 0) / scheduleDurations.length
      : null;

  const repairDurations = workOrders
    .filter((row) => row.startedAt && row.completedAt)
    .map((row) => (row.completedAt!.getTime() - row.startedAt!.getTime()) / 3_600_000)
    .filter((value) => value >= 0);
  const meanTimeToRepairHours =
    repairDurations.length > 0
      ? repairDurations.reduce((sum, value) => sum + value, 0) / repairDurations.length
      : null;

  const downtimeClosedWindow = downtime.filter(
    (row) => row.startedAt >= windowStart && row.endedAt,
  );
  const avgDowntimeMinutes =
    downtimeClosedWindow.length > 0
      ? downtimeClosedWindow
          .map(
            (row) =>
              ((row.endedAt?.getTime() ?? row.startedAt.getTime()) - row.startedAt.getTime()) /
              60_000,
          )
          .filter((value) => value >= 0)
          .reduce((sum, value) => sum + value, 0) / downtimeClosedWindow.length
      : null;

  const reasonCounter = new Map<string, number>();
  for (const row of downtime.filter((item) => item.startedAt >= windowStart)) {
    const workflow = parseDowntimeRcaWorkflow(row.note);
    const key = workflow.reasonCategory || row.reason || 'uncategorized';
    reasonCounter.set(key, (reasonCounter.get(key) ?? 0) + 1);
  }
  const topReasons = [...reasonCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));

  return {
    summary: {
      windowDays,
      totalWorkOrders: workOrders.length,
      openBacklog: openBacklog.length,
      duePlans: duePlans.length,
      preventiveCompleted: preventiveCompleted.length,
      preventiveCompliancePct,
      completedInWindow: completedInWindow.length,
      slaBreachCount: slaBreached.length,
      slaBreachPct,
      meanTimeToScheduleHours,
      meanTimeToRepairHours,
      activeDowntime: downtime.filter((row) => !row.endedAt).length,
      averageDowntimeMinutes: avgDowntimeMinutes,
    },
    backlogAging,
    topReasons,
  };
}

export async function getFleetMaintenanceReliabilityTrendsSvc(input: {
  companyId: string;
  windowDays?: number;
}) {
  const windowDays = Math.max(7, Math.min(365, input.windowDays ?? 90));
  const now = Date.now();
  const windowStart = new Date(now - windowDays * 24 * 60 * 60 * 1000);

  const [downtime, vehicles] = await Promise.all([
    listFleetDowntimeEventsRepo({ companyId: input.companyId, openOnly: null }),
    listFleetVehiclesRepo({
      companyId: input.companyId,
      limit: 2000,
      offset: 0,
      search: null,
      isActive: null,
    }),
  ]);
  const vehicleById = new Map(vehicles.data.map((row) => [row.id, row]));

  const events = downtime.filter((row) => row.startedAt >= windowStart);
  const monthlyMap = new Map<
    string,
    { failures: number; totalDowntimeMinutes: number; starts: Date[] }
  >();
  const byVehicleMap = new Map<
    string,
    {
      vehiclePlateNumber: string | null;
      failures: number;
      totalDowntimeMinutes: number;
      starts: Date[];
    }
  >();
  const byBranchMap = new Map<
    string,
    { branchId: string | null; failures: number; totalDowntimeMinutes: number; starts: Date[] }
  >();
  const byVehicleClassMap = new Map<
    string,
    { vehicleClass: string; failures: number; totalDowntimeMinutes: number; starts: Date[] }
  >();

  for (const row of events) {
    const month = row.startedAt.toISOString().slice(0, 7);
    const durationMinutes =
      row.endedAt && row.endedAt.getTime() >= row.startedAt.getTime()
        ? (row.endedAt.getTime() - row.startedAt.getTime()) / 60_000
        : 0;
    const vehicle = vehicleById.get(row.vehicleId);
    const branchId = vehicle?.branchId ?? null;

    const monthBucket = monthlyMap.get(month) ?? {
      failures: 0,
      totalDowntimeMinutes: 0,
      starts: [],
    };
    monthBucket.failures += 1;
    monthBucket.totalDowntimeMinutes += durationMinutes;
    monthBucket.starts.push(row.startedAt);
    monthlyMap.set(month, monthBucket);

    const vehicleBucket = byVehicleMap.get(row.vehicleId) ?? {
      vehiclePlateNumber: row.vehiclePlateNumber,
      failures: 0,
      totalDowntimeMinutes: 0,
      starts: [],
    };
    vehicleBucket.failures += 1;
    vehicleBucket.totalDowntimeMinutes += durationMinutes;
    vehicleBucket.starts.push(row.startedAt);
    byVehicleMap.set(row.vehicleId, vehicleBucket);

    const branchKey = branchId ?? '__none__';
    const branchBucket = byBranchMap.get(branchKey) ?? {
      branchId,
      failures: 0,
      totalDowntimeMinutes: 0,
      starts: [],
    };
    branchBucket.failures += 1;
    branchBucket.totalDowntimeMinutes += durationMinutes;
    branchBucket.starts.push(row.startedAt);
    byBranchMap.set(branchKey, branchBucket);

    const vehicleClass = (vehicle?.model?.trim() || 'Unclassified').slice(0, 80);
    const classBucket = byVehicleClassMap.get(vehicleClass) ?? {
      vehicleClass,
      failures: 0,
      totalDowntimeMinutes: 0,
      starts: [],
    };
    classBucket.failures += 1;
    classBucket.totalDowntimeMinutes += durationMinutes;
    classBucket.starts.push(row.startedAt);
    byVehicleClassMap.set(vehicleClass, classBucket);
  }

  function computeMtbfHours(starts: Date[]) {
    const sorted = [...starts].sort((a, b) => a.getTime() - b.getTime());
    if (sorted.length < 2) return null;
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      intervals.push((sorted[i]!.getTime() - sorted[i - 1]!.getTime()) / 3_600_000);
    }
    return intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  }

  const monthly = [...monthlyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, bucket]) => ({
      month,
      failures: bucket.failures,
      totalDowntimeMinutes: bucket.totalDowntimeMinutes,
      mtbfHours: computeMtbfHours(bucket.starts),
      mttrMinutes: bucket.failures > 0 ? bucket.totalDowntimeMinutes / bucket.failures : null,
    }));

  const byVehicle = [...byVehicleMap.entries()]
    .map(([vehicleId, bucket]) => ({
      vehicleId,
      vehiclePlateNumber: bucket.vehiclePlateNumber,
      failures: bucket.failures,
      totalDowntimeMinutes: bucket.totalDowntimeMinutes,
      mtbfHours: computeMtbfHours(bucket.starts),
      mttrMinutes: bucket.failures > 0 ? bucket.totalDowntimeMinutes / bucket.failures : null,
    }))
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 50);

  const byBranch = [...byBranchMap.values()]
    .map((bucket) => ({
      branchId: bucket.branchId,
      failures: bucket.failures,
      totalDowntimeMinutes: bucket.totalDowntimeMinutes,
      mtbfHours: computeMtbfHours(bucket.starts),
      mttrMinutes: bucket.failures > 0 ? bucket.totalDowntimeMinutes / bucket.failures : null,
    }))
    .sort((a, b) => b.failures - a.failures);

  const byVehicleClass = [...byVehicleClassMap.values()]
    .map((bucket) => ({
      vehicleClass: bucket.vehicleClass,
      failures: bucket.failures,
      totalDowntimeMinutes: bucket.totalDowntimeMinutes,
      mtbfHours: computeMtbfHours(bucket.starts),
      mttrMinutes: bucket.failures > 0 ? bucket.totalDowntimeMinutes / bucket.failures : null,
    }))
    .sort((a, b) => b.failures - a.failures);

  const recentMonthly = monthly.slice(-3);
  const nextMonthFrom = monthly.length
    ? new Date(`${monthly[monthly.length - 1]!.month}-01T00:00:00.000Z`)
    : new Date();
  const avgFailures = recentMonthly.length
    ? recentMonthly.reduce((sum, row) => sum + row.failures, 0) / recentMonthly.length
    : 0;
  const avgDowntimeMinutes = recentMonthly.length
    ? recentMonthly.reduce((sum, row) => sum + row.totalDowntimeMinutes, 0) / recentMonthly.length
    : 0;
  const forecast = Array.from({ length: 3 }).map((_, index) => {
    const d = new Date(nextMonthFrom);
    d.setUTCMonth(d.getUTCMonth() + (index + 1));
    const month = d.toISOString().slice(0, 7);
    const mttrMinutes = avgFailures > 0 ? avgDowntimeMinutes / avgFailures : null;
    return {
      month,
      projectedFailures: avgFailures,
      projectedDowntimeMinutes: avgDowntimeMinutes,
      projectedMttrMinutes: mttrMinutes,
    };
  });

  return {
    summary: {
      windowDays,
      totalFailures: events.length,
      totalDowntimeMinutes: events.reduce((sum, row) => {
        const dur =
          row.endedAt && row.endedAt.getTime() >= row.startedAt.getTime()
            ? (row.endedAt.getTime() - row.startedAt.getTime()) / 60_000
            : 0;
        return sum + dur;
      }, 0),
    },
    monthly,
    byVehicle,
    byBranch,
    byVehicleClass,
    forecast,
  };
}

export async function listFleetMaintenancePartMovementsByWorkOrderSvc(input: {
  companyId: string;
  workOrderId: string;
  limit?: number;
}) {
  const workOrder = await getFleetMaintenanceWorkOrderByIdRepo(input.workOrderId, input.companyId);
  if (!workOrder) throw NotFound('Maintenance work order not found');
  const limit = Math.max(1, Math.min(500, input.limit ?? 200));
  return listFleetMaintenancePartMovementsByWorkOrderRepo({
    companyId: input.companyId,
    workOrderId: input.workOrderId,
    limit,
  });
}

export async function getFleetMaintenanceProcurementTraceabilitySvc(input: {
  companyId: string;
  branchId?: string | null;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(500, input.limit ?? 100));
  const rows = await listFleetMaintenanceProcurementTraceabilityRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    limit,
  });

  const data = rows.map((row) => {
    const approvalGatePassed = row.latestDemandStatus === ProcurementDemandStatus.APPROVED;
    const blockedReason = !row.latestDemandId
      ? 'No procurement demand created yet'
      : !approvalGatePassed
        ? 'Demand not approved yet'
        : null;
    return {
      ...row,
      approvalGatePassed,
      blockedReason,
      receiptGapQty: Math.max(0, row.orderedQty - row.receivedQty),
    };
  });

  return {
    summary: {
      totalParts: data.length,
      belowReorder: data.filter((row) => row.qtyOnHand < row.reorderLevel).length,
      demandCreated: data.filter((row) => !!row.latestDemandId).length,
      demandApproved: data.filter(
        (row) => row.latestDemandStatus === ProcurementDemandStatus.APPROVED,
      ).length,
      poRaised: data.filter((row) => !!row.latestPoId).length,
      fullyReceived: data.filter((row) => row.orderedQty > 0 && row.receivedQty >= row.orderedQty)
        .length,
    },
    data,
  };
}

export async function runFleetMaintenanceReorderDemandJobSvc(input: {
  companyId: string;
  actorUserId: string;
  dueWithinDays?: number;
  lowStockLimit?: number;
  replenishMultiplier?: number;
}) {
  const result = await runFleetMaintenanceAutomationJobSvc({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    dueWithinDays: input.dueWithinDays ?? 0,
    planLimit: 1,
    autoCreateWorkOrders: false,
    autoCreateProcurementDemands: true,
    lowStockLimit: input.lowStockLimit ?? 200,
    replenishMultiplier: input.replenishMultiplier ?? 1,
  });

  return {
    lowStockCandidates: result.lowStockCandidates,
    procurementDemandsCreated: result.procurementDemandsCreated,
    procurementDemandIds: result.procurementDemandIds,
  };
}

export async function listFleetReliabilityMetricsSvc(input: {
  companyId: string;
  vehicleId?: string | null;
}) {
  const [downtimeEvents, workOrders] = await Promise.all([
    listFleetDowntimeEventsRepo({
      companyId: input.companyId,
      vehicleId: input.vehicleId ?? null,
      openOnly: false,
    }),
    listFleetMaintenanceWorkOrdersRepo({
      companyId: input.companyId,
      vehicleId: input.vehicleId ?? null,
      status: null,
    }),
  ]);

  const byVehicle = new Map<
    string,
    {
      vehiclePlateNumber: string | null;
      downtimeEvents: { startedAt: Date; endedAt: Date | null }[];
      completedOrders: { startedAt: Date | null; completedAt: Date | null }[];
    }
  >();

  for (const event of downtimeEvents) {
    if (!byVehicle.has(event.vehicleId)) {
      byVehicle.set(event.vehicleId, {
        vehiclePlateNumber: event.vehiclePlateNumber,
        downtimeEvents: [],
        completedOrders: [],
      });
    }
    byVehicle.get(event.vehicleId)!.downtimeEvents.push({
      startedAt: event.startedAt,
      endedAt: event.endedAt,
    });
  }
  for (const wo of workOrders) {
    if (!byVehicle.has(wo.vehicleId)) {
      byVehicle.set(wo.vehicleId, {
        vehiclePlateNumber: wo.vehiclePlateNumber,
        downtimeEvents: [],
        completedOrders: [],
      });
    }
    if (wo.status === FleetMaintenanceWorkOrderStatus.COMPLETED) {
      byVehicle.get(wo.vehicleId)!.completedOrders.push({
        startedAt: wo.startedAt,
        completedAt: wo.completedAt,
      });
    }
  }

  return Array.from(byVehicle.entries()).map(([vehicleId, data]) => {
    const sortedFailures = [...data.downtimeEvents].sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    );
    const failureIntervalsHours: number[] = [];
    for (let i = 1; i < sortedFailures.length; i += 1) {
      const prev = sortedFailures[i - 1]!;
      const curr = sortedFailures[i]!;
      failureIntervalsHours.push((curr.startedAt.getTime() - prev.startedAt.getTime()) / 3_600_000);
    }
    const mtbfHours =
      failureIntervalsHours.length > 0
        ? failureIntervalsHours.reduce((sum, value) => sum + value, 0) /
          failureIntervalsHours.length
        : null;

    const repairDurationsMinutes = data.completedOrders
      .filter((item) => item.startedAt && item.completedAt)
      .map((item) => (item.completedAt!.getTime() - item.startedAt!.getTime()) / 60_000)
      .filter((value) => value >= 0);
    const mttrMinutes =
      repairDurationsMinutes.length > 0
        ? repairDurationsMinutes.reduce((sum, value) => sum + value, 0) /
          repairDurationsMinutes.length
        : null;

    const totalDowntimeMinutes = sortedFailures
      .filter((item) => item.endedAt)
      .map((item) => (item.endedAt!.getTime() - item.startedAt.getTime()) / 60_000)
      .filter((value) => value >= 0)
      .reduce((sum, value) => sum + value, 0);

    return {
      vehicleId,
      vehiclePlateNumber: data.vehiclePlateNumber,
      failureCount: sortedFailures.length,
      mtbfHours,
      mttrMinutes,
      totalDowntimeMinutes,
    };
  });
}

export async function getFleetMaintenanceDashboardSvc(input: {
  companyId: string;
  horizonDays?: number;
}) {
  const horizonDays = Math.max(1, Math.min(180, input.horizonDays ?? 14));
  const now = new Date();
  const cutoff = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const [plans, workOrders, downtimeEvents, reliability] = await Promise.all([
    listFleetMaintenancePlansRepo({ companyId: input.companyId, isActive: true }),
    listFleetMaintenanceWorkOrdersRepo({ companyId: input.companyId }),
    listFleetDowntimeEventsRepo({ companyId: input.companyId, openOnly: true }),
    listFleetReliabilityMetricsSvc({ companyId: input.companyId }),
  ]);

  const overduePlans = plans.filter(
    (plan) => plan.nextDueAt && plan.nextDueAt.getTime() < now.getTime(),
  );
  const dueSoonPlans = plans.filter(
    (plan) =>
      plan.nextDueAt &&
      plan.nextDueAt.getTime() >= now.getTime() &&
      plan.nextDueAt.getTime() <= cutoff.getTime(),
  );
  const openWorkOrders = workOrders.filter(
    (item) =>
      item.status === FleetMaintenanceWorkOrderStatus.OPEN ||
      item.status === FleetMaintenanceWorkOrderStatus.IN_PROGRESS,
  );

  return {
    summary: {
      overduePlans: overduePlans.length,
      dueSoonPlans: dueSoonPlans.length,
      openWorkOrders: openWorkOrders.length,
      activeDowntime: downtimeEvents.length,
    },
    overduePlans,
    dueSoonPlans,
    openWorkOrders,
    activeDowntimeEvents: downtimeEvents,
    reliability,
  };
}

export async function listFleetTripsSvc(params: ListFleetTripsParams) {
  return listFleetTripsRepo(params);
}

export async function listFleetRoutePlansSvc(input: ListFleetRoutePlansParams) {
  return listFleetRoutePlansRepo(input);
}

export async function getFleetRoutePlanSvc(input: { companyId: string; id: string }) {
  const plan = await getFleetRoutePlanByIdRepo(input.id, input.companyId);
  if (!plan) throw NotFound('Route plan not found');
  const stops = await listFleetRoutePlanStopsRepo(input.companyId, input.id);
  return { ...plan, stops };
}

export async function createFleetRoutePlanSvc(input: {
  companyId: string;
  actorUserId: string;
  branchId?: string | null;
  name: string;
  code?: string | null;
  originLabel?: string | null;
  destinationLabel?: string | null;
  distanceKm?: number | null;
  estimatedDurationMin?: number | null;
  isActive?: boolean;
  stops?: Array<{
    sequenceNo: number;
    label: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    plannedArrivalOffsetMin?: number | null;
    note?: string | null;
  }>;
}) {
  const created = await createFleetRoutePlanRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    name: input.name.trim(),
    code: input.code?.trim() || null,
    originLabel: input.originLabel?.trim() || null,
    destinationLabel: input.destinationLabel?.trim() || null,
    distanceKm: input.distanceKm ?? null,
    estimatedDurationMin: input.estimatedDurationMin ?? null,
    isActive: input.isActive ?? true,
    createdBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create route plan');

  const stops = (input.stops ?? [])
    .map((stop) => ({
      ...stop,
      label: stop.label.trim(),
    }))
    .filter((stop) => stop.label.length > 0)
    .sort((a, b) => a.sequenceNo - b.sequenceNo);

  const hasDuplicateSequence = new Set(stops.map((item) => item.sequenceNo)).size !== stops.length;
  if (hasDuplicateSequence) {
    throw Conflict('Route plan stops contain duplicate sequence numbers');
  }

  if (stops.length > 0) {
    await replaceFleetRoutePlanStopsRepo({
      companyId: input.companyId,
      routePlanId: created.id,
      stops,
    });
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_route_plan',
    entityId: created.id,
    action: 'FLEET_ROUTE_PLAN_CREATED',
    message: `Route plan created: ${input.name}`,
    metadata: { stopCount: stops.length },
  });

  return created;
}

async function assertRoutePlanAssignable(companyId: string, routePlanId: string) {
  const routePlan = await getFleetRoutePlanByIdRepo(routePlanId, companyId);
  if (!routePlan) throw Conflict('Route plan not found');
  if (!routePlan.isActive) throw Conflict('Route plan is inactive');
  return routePlan;
}

export async function getFleetTripSvc(input: { id: string; companyId: string }) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  return trip;
}

async function assertAssignableEmployee(companyId: string, employeeId: string) {
  const employee = await getEmployeeByIdRepo(companyId, employeeId);
  if (!employee || !isEmployeeAssignableToFleet(employee)) {
    throw Conflict('Employee is not active or does not exist');
  }
  return employee;
}

async function assertDriverEmployee(companyId: string, employeeId: string) {
  const employee = await assertAssignableEmployee(companyId, employeeId);
  if (!isDriverTitle(employee.jobTitleName)) {
    throw Conflict('Selected driver employee must have a Driver job title');
  }
  return employee;
}

function normalizeCrewEmployeeIds(input: string[], driverEmployeeId: string) {
  const hasDuplicateIds = new Set(input).size !== input.length;
  if (hasDuplicateIds) {
    throw Conflict('Crew assignment contains duplicate employees');
  }
  if (input.includes(driverEmployeeId)) {
    throw Conflict('Driver cannot be included in the crew list');
  }
  return input;
}

export async function createFleetTripSvc(input: {
  companyId: string;
  actorUserId: string;
  branchId?: string | null;
  vehicleId: string;
  routePlanId?: string | null;
  driverEmployeeId: string;
  crewEmployeeIds?: string[] | null;
  plannedStartAt?: Date | null;
  plannedEndAt?: Date | null;
  note?: string | null;
}) {
  const vehicle = await getFleetVehicleByIdRepo(input.companyId, input.vehicleId);
  if (!vehicle || !vehicle.isActive) throw Conflict('Vehicle is inactive or does not exist');

  await assertDriverEmployee(input.companyId, input.driverEmployeeId);
  if (input.routePlanId) {
    await assertRoutePlanAssignable(input.companyId, input.routePlanId);
  }

  const [vehicleInUse, driverInUse] = await Promise.all([
    findActiveFleetTripByVehicleRepo(input.companyId, input.vehicleId),
    findActiveFleetTripByDriverRepo(input.companyId, input.driverEmployeeId),
  ]);
  if (vehicleInUse) throw Conflict('Vehicle already has an in-progress trip');
  if (driverInUse) throw Conflict('Driver already has an in-progress trip');

  const created = await createFleetTripRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    tripNo: buildTripNo(),
    vehicleId: input.vehicleId,
    routePlanId: input.routePlanId ?? null,
    driverEmployeeId: input.driverEmployeeId,
    plannedStartAt: input.plannedStartAt ?? null,
    plannedEndAt: input.plannedEndAt ?? null,
    note: input.note ?? null,
    status: FleetTripStatus.PLANNED,
    createdBy: input.actorUserId,
    updatedBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create trip');

  const crewEmployeeIds = normalizeCrewEmployeeIds(
    input.crewEmployeeIds ?? [],
    input.driverEmployeeId,
  );

  for (const employeeId of crewEmployeeIds) {
    await assertAssignableEmployee(input.companyId, employeeId);
  }

  if (crewEmployeeIds.length) {
    await replaceFleetTripCrewRepo({
      companyId: input.companyId,
      tripId: created.id,
      actorUserId: input.actorUserId,
      crewEmployeeIds,
    });
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: created.id,
    action: 'FLEET_TRIP_CREATED',
    message: 'Fleet trip created',
    metadata: {
      vehicleId: input.vehicleId,
      routePlanId: input.routePlanId ?? null,
      driverEmployeeId: input.driverEmployeeId,
    },
  });

  return created;
}

export async function assignFleetTripRouteSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  routePlanId?: string | null;
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status === FleetTripStatus.COMPLETED || trip.status === FleetTripStatus.CANCELLED) {
    throw Conflict('Cannot modify route for completed or cancelled trips');
  }

  if (input.routePlanId) {
    await assertRoutePlanAssignable(input.companyId, input.routePlanId);
  }

  const updated = await updateFleetTripRepo(input.id, input.companyId, {
    routePlanId: input.routePlanId ?? null,
    updatedBy: input.actorUserId,
    updatedAt: new Date(),
  } satisfies Partial<typeof fleetTrips.$inferInsert>);
  if (!updated) throw NotFound('Trip not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: input.id,
    action: 'FLEET_TRIP_ROUTE_ASSIGNED',
    message: input.routePlanId ? 'Fleet trip route assigned' : 'Fleet trip route unassigned',
    metadata: { routePlanId: input.routePlanId ?? null },
  });

  return { id: input.id };
}

export async function assignFleetTripCrewSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  crewEmployeeIds: string[];
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status === FleetTripStatus.COMPLETED || trip.status === FleetTripStatus.CANCELLED) {
    throw Conflict('Cannot modify crew for completed or cancelled trips');
  }

  const crewEmployeeIds = normalizeCrewEmployeeIds(input.crewEmployeeIds, trip.driverEmployeeId);
  for (const employeeId of crewEmployeeIds) {
    await assertAssignableEmployee(input.companyId, employeeId);
  }

  await replaceFleetTripCrewRepo({
    companyId: input.companyId,
    tripId: input.id,
    actorUserId: input.actorUserId,
    crewEmployeeIds,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: input.id,
    action: 'FLEET_TRIP_CREW_ASSIGNED',
    message: 'Fleet trip crew assignment updated',
    metadata: { crewEmployeeIds },
  });

  return { id: input.id };
}

export async function startFleetTripSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  startOdometerKm?: number | null;
  note?: string | null;
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status !== FleetTripStatus.PLANNED) throw Conflict('Only planned trips can be started');
  if (typeof input.startOdometerKm !== 'number') {
    throw Conflict('Start odometer is required to start trip');
  }

  const [vehicleConflict, driverConflict] = await Promise.all([
    findActiveFleetTripByVehicleRepo(input.companyId, trip.vehicleId),
    findActiveFleetTripByDriverRepo(input.companyId, trip.driverEmployeeId),
  ]);
  if (vehicleConflict && vehicleConflict.id !== input.id) {
    throw Conflict('Vehicle already has another in-progress trip');
  }
  if (driverConflict && driverConflict.id !== input.id) {
    throw Conflict('Driver already has another in-progress trip');
  }

  const updated = await updateFleetTripRepo(input.id, input.companyId, {
    status: FleetTripStatus.IN_PROGRESS,
    startedAt: new Date(),
    startOdometerKm: input.startOdometerKm ?? trip.startOdometerKm ?? null,
    note: input.note ?? trip.note ?? null,
    updatedBy: input.actorUserId,
    updatedAt: new Date(),
  } satisfies Partial<typeof fleetTrips.$inferInsert>);
  if (!updated) throw NotFound('Trip not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: input.id,
    action: 'FLEET_TRIP_STARTED',
    message: `Fleet trip started: ${trip.tripNo}`,
    metadata: { startOdometerKm: input.startOdometerKm ?? null },
  });

  return updated;
}

export async function closeFleetTripSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  endOdometerKm?: number | null;
  note?: string | null;
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status !== FleetTripStatus.IN_PROGRESS) {
    throw Conflict('Only in-progress trips can be closed');
  }
  if (typeof input.endOdometerKm !== 'number') {
    throw Conflict('End odometer is required to close trip');
  }

  const endOdometerKm = input.endOdometerKm;
  if (
    typeof trip.startOdometerKm === 'number' &&
    typeof endOdometerKm === 'number' &&
    endOdometerKm < trip.startOdometerKm
  ) {
    throw Conflict('End odometer cannot be less than start odometer');
  }

  const updated = await updateFleetTripRepo(input.id, input.companyId, {
    status: FleetTripStatus.COMPLETED,
    endedAt: new Date(),
    endOdometerKm,
    note: input.note ?? trip.note ?? null,
    updatedBy: input.actorUserId,
    updatedAt: new Date(),
  } satisfies Partial<typeof fleetTrips.$inferInsert>);
  if (!updated) throw NotFound('Trip not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: input.id,
    action: 'FLEET_TRIP_CLOSED',
    message: `Fleet trip closed: ${trip.tripNo}`,
    metadata: { endOdometerKm },
  });

  return updated;
}

export async function getFleetTripCrewSvc(input: { id: string; companyId: string }) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  return listFleetTripCrewRepo(input.companyId, input.id);
}

export async function listFleetTripEventsSvc(input: { id: string; companyId: string }) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  return listFleetTripEventsRepo(input.companyId, input.id);
}

export async function createFleetTripEventSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  eventType: number;
  occurredAt?: Date | null;
  odometerKm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string | null;
  note?: string | null;
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status !== FleetTripStatus.IN_PROGRESS) {
    throw Conflict('Trip event can only be recorded for in-progress trips');
  }
  if (
    input.eventType !== FleetTripEventType.CHECK_IN &&
    input.eventType !== FleetTripEventType.CHECK_OUT
  ) {
    throw Conflict('Unsupported trip event type');
  }
  if (typeof input.odometerKm !== 'number') {
    throw Conflict('Odometer is required for check-in/check-out');
  }
  if (!input.locationLabel?.trim()) {
    throw Conflict('Location label is required for check-in/check-out');
  }

  const occurredAt = input.occurredAt ?? new Date();
  if (trip.startedAt && occurredAt.getTime() < trip.startedAt.getTime()) {
    throw Conflict('Event time cannot be before trip start');
  }
  if (trip.endedAt && occurredAt.getTime() > trip.endedAt.getTime()) {
    throw Conflict('Event time cannot be after trip close');
  }

  const existingEvents = await listFleetTripEventsRepo(input.companyId, input.id);
  const latestEvent = existingEvents[0] ?? null;
  if (
    latestEvent &&
    typeof latestEvent.odometerKm === 'number' &&
    input.odometerKm < latestEvent.odometerKm
  ) {
    throw Conflict('Event odometer cannot be less than previous check event odometer');
  }
  if (typeof trip.startOdometerKm === 'number' && input.odometerKm < trip.startOdometerKm) {
    throw Conflict('Event odometer cannot be less than trip start odometer');
  }
  if (
    input.eventType === FleetTripEventType.CHECK_IN &&
    latestEvent?.eventType === FleetTripEventType.CHECK_IN
  ) {
    throw Conflict('Cannot record consecutive check-in without check-out');
  }
  if (
    input.eventType === FleetTripEventType.CHECK_OUT &&
    latestEvent?.eventType !== FleetTripEventType.CHECK_IN
  ) {
    throw Conflict('Cannot record check-out without an open check-in');
  }

  const created = await createFleetTripEventRepo({
    companyId: input.companyId,
    tripId: input.id,
    eventType: input.eventType,
    occurredAt,
    odometerKm: input.odometerKm,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    locationLabel: input.locationLabel.trim(),
    note: input.note?.trim() || null,
    createdBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to record trip event');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: input.id,
    action: 'FLEET_TRIP_EVENT_RECORDED',
    message: `Fleet trip event recorded: ${tripEventLabel(input.eventType)}`,
    metadata: {
      eventType: input.eventType,
      odometerKm: input.odometerKm ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    },
  });

  return created;
}

export async function listFleetTripLoadMatchesSvc(input: { id: string; companyId: string }) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  return listFleetTripLoadMatchesRepo(input.companyId, input.id);
}

export async function assignFleetTripLoadMatchSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  parcelId: string;
  note?: string | null;
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status === FleetTripStatus.COMPLETED || trip.status === FleetTripStatus.CANCELLED) {
    throw Conflict('Cannot assign loads for completed or cancelled trips');
  }

  const parcel = await findFleetParcelByIdRepo(input.companyId, input.parcelId);
  if (!parcel || parcel.isDeleted) {
    throw Conflict('Parcel not found');
  }

  const existingActive = await findActiveFleetLoadMatchForParcelRepo(
    input.companyId,
    input.parcelId,
  );
  if (existingActive && existingActive.tripId !== input.id) {
    throw Conflict('Parcel is already assigned to another trip');
  }

  const created = await createFleetTripLoadMatchRepo({
    companyId: input.companyId,
    tripId: input.id,
    parcelId: input.parcelId,
    status: FleetTripLoadMatchStatus.ASSIGNED,
    matchedBy: input.actorUserId,
    note: input.note ?? null,
  });
  if (!created) throw Conflict('Failed to assign load');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: input.id,
    action: 'FLEET_TRIP_LOAD_ASSIGNED',
    message: 'Fleet trip load assigned',
    metadata: { parcelId: input.parcelId },
  });

  return created;
}

export async function updateFleetTripLoadMatchStatusSvc(input: {
  loadMatchId: string;
  companyId: string;
  actorUserId: string;
  status: number;
  note?: string | null;
}) {
  const existing = await getFleetTripLoadMatchByIdRepo(input.loadMatchId, input.companyId);
  if (!existing) throw NotFound('Load match not found');

  if (
    input.status !== FleetTripLoadMatchStatus.ASSIGNED &&
    input.status !== FleetTripLoadMatchStatus.LOADED &&
    input.status !== FleetTripLoadMatchStatus.UNLOADED &&
    input.status !== FleetTripLoadMatchStatus.CANCELLED
  ) {
    throw Conflict('Unsupported load match status');
  }
  if (existing.status === FleetTripLoadMatchStatus.CANCELLED) {
    throw Conflict('Cannot update cancelled load match');
  }
  if (existing.status === FleetTripLoadMatchStatus.UNLOADED) {
    throw Conflict('Cannot update unloaded load match');
  }
  if (
    input.status === FleetTripLoadMatchStatus.LOADED &&
    existing.status !== FleetTripLoadMatchStatus.ASSIGNED
  ) {
    throw Conflict('Only assigned load can be marked as loaded');
  }
  if (
    input.status === FleetTripLoadMatchStatus.UNLOADED &&
    existing.status !== FleetTripLoadMatchStatus.LOADED
  ) {
    throw Conflict('Only loaded load can be marked as unloaded');
  }

  const trip = await getFleetTripByIdRepo(existing.tripId, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status === FleetTripStatus.COMPLETED || trip.status === FleetTripStatus.CANCELLED) {
    throw Conflict('Cannot update load status for completed or cancelled trips');
  }

  const patch: Partial<typeof fleetTripLoadMatches.$inferInsert> = {
    status: input.status,
    note: input.note ?? existing.note ?? null,
    updatedAt: new Date(),
  };
  if (input.status === FleetTripLoadMatchStatus.LOADED) {
    patch.loadedAt = new Date();
  }
  if (input.status === FleetTripLoadMatchStatus.UNLOADED) {
    patch.unloadedAt = new Date();
  }

  const updated = await updateFleetTripLoadMatchRepo(input.loadMatchId, input.companyId, patch);
  if (!updated) throw NotFound('Load match not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: existing.tripId,
    action: 'FLEET_TRIP_LOAD_STATUS_UPDATED',
    message: `Fleet trip load status updated: ${tripLoadMatchLabel(input.status)}`,
    metadata: { loadMatchId: input.loadMatchId, status: input.status },
  });

  return updated;
}

export async function recordFleetTripTelemetryPointSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  sampledAt?: Date | null;
  latitude: number;
  longitude: number;
  speedKph?: number | null;
  headingDeg?: number | null;
  altitudeM?: number | null;
  accuracyM?: number | null;
  source?: string | null;
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status !== FleetTripStatus.IN_PROGRESS) {
    throw Conflict('Telemetry can only be recorded for in-progress trips');
  }

  const created = await createFleetTripTelemetryPointRepo({
    companyId: input.companyId,
    tripId: input.id,
    sampledAt: input.sampledAt ?? new Date(),
    latitude: input.latitude,
    longitude: input.longitude,
    speedKph: input.speedKph ?? null,
    headingDeg: input.headingDeg ?? null,
    altitudeM: input.altitudeM ?? null,
    accuracyM: input.accuracyM ?? null,
    source: input.source?.trim() || null,
    createdBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to record telemetry point');
  return created;
}

export async function listFleetTripTelemetryPointsSvc(input: {
  id: string;
  companyId: string;
  limit?: number | null;
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  return listFleetTripTelemetryPointsRepo(input.companyId, input.id, input.limit ?? 200);
}

export async function recordFleetTripStatusUpdateSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  statusType: number;
  occurredAt?: Date | null;
  locationLabel?: string | null;
  note?: string | null;
}) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status !== FleetTripStatus.IN_PROGRESS) {
    throw Conflict('Trip status updates can only be recorded for in-progress trips');
  }
  if (
    input.statusType !== FleetTripStatusUpdateType.EN_ROUTE &&
    input.statusType !== FleetTripStatusUpdateType.AT_PICKUP &&
    input.statusType !== FleetTripStatusUpdateType.AT_DROPOFF &&
    input.statusType !== FleetTripStatusUpdateType.DELAYED &&
    input.statusType !== FleetTripStatusUpdateType.STOPPED
  ) {
    throw Conflict('Unsupported status update type');
  }

  const created = await createFleetTripStatusUpdateRepo({
    companyId: input.companyId,
    tripId: input.id,
    statusType: input.statusType,
    occurredAt: input.occurredAt ?? new Date(),
    locationLabel: input.locationLabel?.trim() || null,
    note: input.note?.trim() || null,
    createdBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create trip status update');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_trip',
    entityId: input.id,
    action: 'FLEET_TRIP_STATUS_UPDATED',
    message: `Fleet trip status update recorded: ${tripStatusUpdateLabel(input.statusType)}`,
    metadata: { statusType: input.statusType },
  });

  return created;
}

export async function listFleetTripStatusUpdatesSvc(input: { id: string; companyId: string }) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  return listFleetTripStatusUpdatesRepo(input.companyId, input.id);
}

export async function getFleetTripTimelineSvc(input: { id: string; companyId: string }) {
  const trip = await getFleetTripByIdRepo(input.id, input.companyId);
  if (!trip) throw NotFound('Trip not found');

  const [events, statuses, telemetry, loads] = await Promise.all([
    listFleetTripEventsRepo(input.companyId, input.id),
    listFleetTripStatusUpdatesRepo(input.companyId, input.id),
    listFleetTripTelemetryPointsRepo(input.companyId, input.id, 200),
    listFleetTripLoadMatchesRepo(input.companyId, input.id),
  ]);

  const base = [
    ...(trip.startedAt
      ? [
          {
            kind: 'trip_started' as const,
            occurredAt: trip.startedAt,
            payload: { startOdometerKm: trip.startOdometerKm },
          },
        ]
      : []),
    ...(trip.endedAt
      ? [
          {
            kind: 'trip_closed' as const,
            occurredAt: trip.endedAt,
            payload: { endOdometerKm: trip.endOdometerKm },
          },
        ]
      : []),
  ];

  const mappedEvents = events.map((item) => ({
    kind: 'check_event' as const,
    occurredAt: item.occurredAt,
    payload: item,
  }));
  const mappedStatuses = statuses.map((item) => ({
    kind: 'status_update' as const,
    occurredAt: item.occurredAt,
    payload: item,
  }));
  const mappedTelemetry = telemetry.map((item) => ({
    kind: 'telemetry' as const,
    occurredAt: item.sampledAt,
    payload: item,
  }));
  const mappedLoadEvents = loads.flatMap((item) => {
    const rows: Array<{ kind: string; occurredAt: Date; payload: unknown }> = [
      {
        kind: 'load_assigned',
        occurredAt: item.matchedAt,
        payload: item,
      },
    ];
    if (item.loadedAt) {
      rows.push({
        kind: 'load_loaded',
        occurredAt: item.loadedAt,
        payload: item,
      });
    }
    if (item.unloadedAt) {
      rows.push({
        kind: 'load_unloaded',
        occurredAt: item.unloadedAt,
        payload: item,
      });
    }
    return rows;
  });

  return [
    ...base,
    ...mappedEvents,
    ...mappedStatuses,
    ...mappedTelemetry,
    ...mappedLoadEvents,
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}

function assertShiftWindow(shiftStartAt: Date, shiftEndAt: Date) {
  if (!Number.isFinite(shiftStartAt.getTime()) || !Number.isFinite(shiftEndAt.getTime())) {
    throw Conflict('Invalid shift window');
  }
  if (shiftEndAt <= shiftStartAt) {
    throw Conflict('Shift end must be after shift start');
  }
}

export async function listFleetShiftRostersSvc(params: ListFleetShiftRostersParams) {
  return listFleetShiftRostersRepo(params);
}

export async function getFleetShiftRosterSvc(input: { id: string; companyId: string }) {
  const row = await getFleetShiftRosterByIdRepo(input.id, input.companyId);
  if (!row) throw NotFound('Shift roster not found');
  return row;
}

export async function createFleetShiftRosterSvc(input: {
  companyId: string;
  actorUserId: string;
  branchId?: string | null;
  employeeId: string;
  vehicleId?: string | null;
  roleType: number;
  shiftStartAt: Date;
  shiftEndAt: Date;
  note?: string | null;
}) {
  assertShiftWindow(input.shiftStartAt, input.shiftEndAt);
  if (
    input.roleType !== FleetShiftRosterRole.DRIVER &&
    input.roleType !== FleetShiftRosterRole.CREW
  ) {
    throw Conflict('Unsupported roster role');
  }

  if (input.roleType === FleetShiftRosterRole.DRIVER) {
    await assertDriverEmployee(input.companyId, input.employeeId);
  } else {
    await assertAssignableEmployee(input.companyId, input.employeeId);
  }

  if (input.vehicleId) {
    const vehicle = await getFleetVehicleByIdRepo(input.companyId, input.vehicleId);
    if (!vehicle || !vehicle.isActive) throw Conflict('Vehicle is inactive or does not exist');
  }

  const conflicts = await findFleetShiftConflictsRepo({
    companyId: input.companyId,
    employeeId: input.employeeId,
    vehicleId: input.vehicleId ?? null,
    shiftStartAt: input.shiftStartAt,
    shiftEndAt: input.shiftEndAt,
  });
  if (conflicts.employeeConflict) throw Conflict('Employee has overlapping shift roster');
  if (conflicts.vehicleConflict) throw Conflict('Vehicle has overlapping shift roster');

  const created = await createFleetShiftRosterRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    employeeId: input.employeeId,
    vehicleId: input.vehicleId ?? null,
    roleType: input.roleType,
    status: FleetShiftRosterStatus.PLANNED,
    shiftStartAt: input.shiftStartAt,
    shiftEndAt: input.shiftEndAt,
    note: input.note ?? null,
    createdBy: input.actorUserId,
    updatedBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create shift roster');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_shift_roster',
    entityId: created.id,
    action: 'FLEET_SHIFT_ROSTER_CREATED',
    message: 'Fleet shift roster created',
    metadata: { employeeId: input.employeeId, vehicleId: input.vehicleId ?? null },
  });

  return created;
}

export async function updateFleetShiftRosterSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  vehicleId?: string | null;
  status?: number | null;
  shiftStartAt?: Date | null;
  shiftEndAt?: Date | null;
  note?: string | null;
}) {
  const existing = await getFleetShiftRosterByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Shift roster not found');
  if (existing.status === FleetShiftRosterStatus.CANCELLED) {
    throw Conflict('Cannot update cancelled shift roster');
  }

  const shiftStartAt = input.shiftStartAt ?? existing.shiftStartAt;
  const shiftEndAt = input.shiftEndAt ?? existing.shiftEndAt;
  assertShiftWindow(shiftStartAt, shiftEndAt);

  const vehicleId = input.vehicleId !== undefined ? input.vehicleId : existing.vehicleId;
  if (vehicleId) {
    const vehicle = await getFleetVehicleByIdRepo(input.companyId, vehicleId);
    if (!vehicle || !vehicle.isActive) throw Conflict('Vehicle is inactive or does not exist');
  }

  const conflicts = await findFleetShiftConflictsRepo({
    companyId: input.companyId,
    employeeId: existing.employeeId,
    vehicleId: vehicleId ?? null,
    shiftStartAt,
    shiftEndAt,
    excludeRosterId: input.id,
  });
  if (conflicts.employeeConflict) throw Conflict('Employee has overlapping shift roster');
  if (conflicts.vehicleConflict) throw Conflict('Vehicle has overlapping shift roster');

  const nextStatus = input.status ?? existing.status;
  if (
    nextStatus !== FleetShiftRosterStatus.PLANNED &&
    nextStatus !== FleetShiftRosterStatus.COMPLETED &&
    nextStatus !== FleetShiftRosterStatus.CANCELLED
  ) {
    throw Conflict('Unsupported shift roster status');
  }

  const updated = await updateFleetShiftRosterRepo(input.id, input.companyId, {
    vehicleId: vehicleId ?? null,
    status: nextStatus,
    shiftStartAt,
    shiftEndAt,
    note: input.note ?? existing.note ?? null,
    updatedBy: input.actorUserId,
    updatedAt: new Date(),
  } satisfies Partial<typeof fleetShiftRosters.$inferInsert>);
  if (!updated) throw NotFound('Shift roster not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_shift_roster',
    entityId: input.id,
    action: 'FLEET_SHIFT_ROSTER_UPDATED',
    message: 'Fleet shift roster updated',
    metadata: { status: nextStatus, vehicleId: vehicleId ?? null },
  });

  return updated;
}

export async function transitionFleetVehicleLifecycleSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  lifecycleStatus: number;
  note?: string | null;
}) {
  const vehicle = await getFleetVehicleByIdRepo(input.id, input.companyId);
  if (!vehicle) throw NotFound('Vehicle not found');
  if (!isValidLifecycleTransition(vehicle.lifecycleStatus, input.lifecycleStatus)) {
    throw Conflict('Invalid vehicle lifecycle transition');
  }

  const updated = await updateFleetVehicleLifecycleRepo(input.id, input.companyId, {
    lifecycleStatus: input.lifecycleStatus,
    updatedAt: new Date(),
  });
  if (!updated) throw NotFound('Vehicle not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_vehicle',
    entityId: input.id,
    action: 'FLEET_VEHICLE_LIFECYCLE_TRANSITIONED',
    message: 'Fleet vehicle lifecycle transitioned',
    metadata: {
      from: vehicle.lifecycleStatus,
      to: input.lifecycleStatus,
      note: input.note ?? null,
    },
  });

  return updated;
}

export async function listFleetComplianceIncidentsSvc(params: ListFleetComplianceIncidentsParams) {
  return listFleetComplianceIncidentsRepo(params);
}

export async function createFleetComplianceIncidentSvc(input: {
  companyId: string;
  actorUserId: string;
  tripId?: string | null;
  vehicleId?: string | null;
  employeeId?: string | null;
  incidentType: number;
  severity: number;
  occurredAt: Date;
  locationLabel?: string | null;
  description: string;
  actionTaken?: string | null;
  resolvedAt?: Date | null;
}) {
  if (
    input.incidentType !== FleetComplianceIncidentType.VIOLATION &&
    input.incidentType !== FleetComplianceIncidentType.ACCIDENT
  ) {
    throw Conflict('Unsupported incident type');
  }
  if (
    input.severity !== FleetComplianceIncidentSeverity.LOW &&
    input.severity !== FleetComplianceIncidentSeverity.MEDIUM &&
    input.severity !== FleetComplianceIncidentSeverity.HIGH &&
    input.severity !== FleetComplianceIncidentSeverity.CRITICAL
  ) {
    throw Conflict('Unsupported incident severity');
  }
  if (!input.description.trim()) throw Conflict('Incident description is required');
  if (input.tripId) {
    const trip = await getFleetTripByIdRepo(input.tripId, input.companyId);
    if (!trip) throw Conflict('Trip not found');
  }
  if (input.vehicleId) {
    const vehicle = await getFleetVehicleByIdRepo(input.companyId, input.vehicleId);
    if (!vehicle) throw Conflict('Vehicle not found');
  }
  if (input.employeeId) {
    await assertAssignableEmployee(input.companyId, input.employeeId);
  }

  const created = await createFleetComplianceIncidentRepo({
    companyId: input.companyId,
    tripId: input.tripId ?? null,
    vehicleId: input.vehicleId ?? null,
    employeeId: input.employeeId ?? null,
    incidentType: input.incidentType,
    severity: input.severity,
    occurredAt: input.occurredAt,
    locationLabel: input.locationLabel?.trim() || null,
    description: input.description.trim(),
    actionTaken: input.actionTaken?.trim() || null,
    resolvedAt: input.resolvedAt ?? null,
    reportedBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create compliance incident');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_compliance_incident',
    entityId: created.id,
    action: 'FLEET_COMPLIANCE_INCIDENT_CREATED',
    message: 'Fleet compliance incident created',
    metadata: { incidentType: input.incidentType, severity: input.severity },
  });

  return created;
}

export async function updateFleetComplianceIncidentSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  severity?: number | null;
  actionTaken?: string | null;
  resolvedAt?: Date | null;
}) {
  const existing = await getFleetComplianceIncidentByIdRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Compliance incident not found');
  if (
    typeof input.severity === 'number' &&
    input.severity !== FleetComplianceIncidentSeverity.LOW &&
    input.severity !== FleetComplianceIncidentSeverity.MEDIUM &&
    input.severity !== FleetComplianceIncidentSeverity.HIGH &&
    input.severity !== FleetComplianceIncidentSeverity.CRITICAL
  ) {
    throw Conflict('Unsupported incident severity');
  }

  const updated = await updateFleetComplianceIncidentRepo(input.companyId, input.id, {
    severity: input.severity ?? existing.severity,
    actionTaken: input.actionTaken === undefined ? existing.actionTaken : input.actionTaken,
    resolvedAt: input.resolvedAt === undefined ? existing.resolvedAt : input.resolvedAt,
    updatedAt: new Date(),
  });
  if (!updated) throw NotFound('Compliance incident not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_compliance_incident',
    entityId: input.id,
    action: 'FLEET_COMPLIANCE_INCIDENT_UPDATED',
    message: 'Fleet compliance incident updated',
    metadata: {
      severity: input.severity ?? existing.severity,
      resolvedAt:
        input.resolvedAt === undefined
          ? (existing.resolvedAt?.toISOString() ?? null)
          : (input.resolvedAt?.toISOString() ?? null),
    },
  });

  return updated;
}

export async function transitionFleetComplianceIncidentCaseSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  action: 'resolve' | 'reopen';
  actionTaken?: string | null;
  resolvedAt?: Date | null;
}) {
  const existing = await getFleetComplianceIncidentByIdRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Compliance incident not found');

  const normalizedActionTaken =
    input.actionTaken === undefined ? undefined : input.actionTaken?.trim() || null;

  if (input.action === 'resolve') {
    if (existing.resolvedAt) throw Conflict('Incident is already resolved');
    const resolutionAt = input.resolvedAt ?? new Date();
    const finalActionTaken = normalizedActionTaken ?? (existing.actionTaken?.trim() || null);
    if (!finalActionTaken) throw Conflict('Action taken is required to resolve incident');

    const updated = await updateFleetComplianceIncidentRepo(input.companyId, input.id, {
      resolvedAt: resolutionAt,
      actionTaken: finalActionTaken,
      updatedAt: new Date(),
    });
    if (!updated) throw NotFound('Compliance incident not found');

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'fleet_compliance_incident',
      entityId: input.id,
      action: 'FLEET_COMPLIANCE_INCIDENT_RESOLVED',
      message: 'Fleet compliance incident resolved',
      metadata: {
        resolvedAt: resolutionAt.toISOString(),
      },
    });
    return { id: input.id, resolvedAt: resolutionAt, caseStatus: 'resolved' as const };
  }

  if (!existing.resolvedAt) throw Conflict('Incident is already open');
  const updated = await updateFleetComplianceIncidentRepo(input.companyId, input.id, {
    resolvedAt: null,
    actionTaken: normalizedActionTaken === undefined ? existing.actionTaken : normalizedActionTaken,
    updatedAt: new Date(),
  });
  if (!updated) throw NotFound('Compliance incident not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_compliance_incident',
    entityId: input.id,
    action: 'FLEET_COMPLIANCE_INCIDENT_REOPENED',
    message: 'Fleet compliance incident reopened',
  });

  return { id: input.id, resolvedAt: null, caseStatus: 'open' as const };
}

export async function listFleetPolicyAcknowledgmentsSvc(
  params: ListFleetPolicyAcknowledgmentsParams,
) {
  return listFleetPolicyAcknowledgmentsRepo(params);
}

export async function acknowledgeFleetPolicySvc(input: {
  companyId: string;
  actorUserId: string;
  employeeId?: string | null;
  userId?: string | null;
  policyCode: string;
  policyVersion: string;
  status?: number;
  acknowledgedAt?: Date | null;
  note?: string | null;
}) {
  const status = input.status ?? FleetPolicyAckStatus.ACKNOWLEDGED;
  if (status !== FleetPolicyAckStatus.ACKNOWLEDGED && status !== FleetPolicyAckStatus.REVOKED) {
    throw Conflict('Unsupported policy acknowledgment status');
  }
  if (!input.employeeId && !input.userId) {
    throw Conflict('Either employeeId or userId is required for policy acknowledgment');
  }
  if (input.employeeId) {
    await assertAssignableEmployee(input.companyId, input.employeeId);
  }

  const upserted = await upsertFleetPolicyAcknowledgmentRepo({
    companyId: input.companyId,
    employeeId: input.employeeId ?? null,
    userId: input.userId ?? null,
    policyCode: input.policyCode.trim(),
    policyVersion: input.policyVersion.trim(),
    status,
    acknowledgedAt: input.acknowledgedAt ?? new Date(),
    note: input.note ?? null,
  });
  if (!upserted) throw Conflict('Failed to save policy acknowledgment');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'fleet_policy_acknowledgment',
    entityId: upserted.id,
    action: 'FLEET_POLICY_ACKNOWLEDGED',
    message: 'Fleet policy acknowledgment recorded',
    metadata: {
      employeeId: input.employeeId ?? null,
      userId: input.userId ?? null,
      policyCode: input.policyCode,
      policyVersion: input.policyVersion,
      status,
    },
  });

  return upserted;
}

export async function listFleetMaintenancePartsSvc(params: ListFleetMaintenancePartsParams) {
  return listFleetMaintenancePartsRepo(params);
}

export async function listFleetMaintenancePartMovementsSvc(input: {
  companyId: string;
  partId: string;
  limit: number;
  offset: number;
}) {
  const part = await getFleetMaintenancePartByIdRepo(input.partId, input.companyId);
  if (!part) throw NotFound('Part not found');
  return listFleetMaintenancePartMovementsRepo(input);
}

export async function createFleetMaintenancePartSvc(input: {
  companyId: string;
  actorUserId: string;
  branchId?: string | null;
  sku: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  qtyOnHand?: number;
  reorderLevel?: number;
  averageUnitCostPsw?: number;
  note?: string | null;
}) {
  const created = await createFleetMaintenancePartRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    sku: input.sku.trim(),
    name: input.name.trim(),
    category: input.category?.trim() || null,
    unit: input.unit?.trim() || 'unit',
    qtyOnHand: input.qtyOnHand ?? 0,
    reorderLevel: input.reorderLevel ?? 0,
    averageUnitCostPsw: input.averageUnitCostPsw ?? 0,
    isActive: true,
    note: input.note ?? null,
    createdBy: input.actorUserId,
    updatedBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create maintenance part');
  return created;
}

export async function adjustFleetMaintenancePartStockSvc(input: {
  companyId: string;
  actorUserId: string;
  partId: string;
  movementType: number; // 0 in, 1 out, 2 adjustment
  quantity: number;
  unitCostPsw?: number;
  workOrderId?: string | null;
  note?: string | null;
}) {
  const part = await getFleetMaintenancePartByIdRepo(input.partId, input.companyId);
  if (!part) throw NotFound('Part not found');
  if (input.quantity <= 0) throw Conflict('Quantity must be greater than 0');
  if (input.movementType < 0 || input.movementType > 2) throw Conflict('Unsupported movement type');

  const delta = input.movementType === 1 ? -input.quantity : input.quantity;
  const nextQty = Number(part.qtyOnHand) + delta;
  if (nextQty < 0) throw Conflict('Insufficient stock for this movement');

  await createFleetMaintenancePartMovementRepo({
    companyId: input.companyId,
    partId: input.partId,
    workOrderId: input.workOrderId ?? null,
    quantity: input.quantity,
    unitCostPsw: input.unitCostPsw ?? Number(part.averageUnitCostPsw ?? 0),
    movementType: input.movementType,
    note: input.note ?? null,
    movedBy: input.actorUserId,
    movedAt: new Date(),
  });

  await updateFleetMaintenancePartRepo(input.partId, input.companyId, {
    qtyOnHand: nextQty,
    averageUnitCostPsw: input.unitCostPsw ?? Number(part.averageUnitCostPsw ?? 0),
    updatedBy: input.actorUserId,
    updatedAt: new Date(),
  });

  return { id: input.partId, qtyOnHand: nextQty };
}

export async function runFleetVehicleLifecycleAutomationJobSvc(input: {
  companyId: string;
  actorUserId: string;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(500, input.limit ?? 200));
  const now = new Date();
  const candidates = await listFleetVehiclesForLifecycleAutomationRepo({
    companyId: input.companyId,
    now,
    limit,
  });

  let movedToMaintenance = 0;
  let movedToRetired = 0;
  let movedToActive = 0;
  const updatedVehicleIds: string[] = [];

  for (const candidate of candidates) {
    const nextStatus =
      candidate.leaseEnded && candidate.ownershipType === FleetVehicleOwnershipType.LEASED
        ? FleetVehicleLifecycleStatus.RETIRED
        : FleetVehicleLifecycleStatus.IN_MAINTENANCE;

    const updated = await updateFleetVehicleLifecycleRepo(candidate.id, input.companyId, {
      lifecycleStatus: nextStatus,
      updatedAt: now,
    });
    if (!updated) continue;

    if (nextStatus === FleetVehicleLifecycleStatus.RETIRED) movedToRetired += 1;
    else movedToMaintenance += 1;

    updatedVehicleIds.push(candidate.id);

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'fleet_vehicle',
      entityId: candidate.id,
      action: 'FLEET_VEHICLE_LIFECYCLE_AUTO_TRANSITIONED',
      message: `Fleet vehicle lifecycle auto-transitioned for ${candidate.plateNumber}`,
      metadata: {
        to: nextStatus,
        reasons: {
          insuranceExpired: candidate.insuranceExpired,
          roadworthyExpired: candidate.roadworthyExpired,
          leaseEnded: candidate.leaseEnded,
          hasExpiredDocument: candidate.hasExpiredDocument,
        },
      },
    });
  }

  const recoveryCandidates = await listFleetVehiclesForLifecycleRecoveryRepo({
    companyId: input.companyId,
    now,
    limit,
  });

  for (const candidate of recoveryCandidates) {
    const updated = await updateFleetVehicleLifecycleRepo(candidate.id, input.companyId, {
      lifecycleStatus: FleetVehicleLifecycleStatus.ACTIVE,
      updatedAt: now,
    });
    if (!updated) continue;
    movedToActive += 1;
    updatedVehicleIds.push(candidate.id);

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'fleet_vehicle',
      entityId: candidate.id,
      action: 'FLEET_VEHICLE_LIFECYCLE_AUTO_RECOVERED',
      message: `Fleet vehicle lifecycle auto-recovered to active for ${candidate.plateNumber}`,
      metadata: {
        to: FleetVehicleLifecycleStatus.ACTIVE,
      },
    });
  }

  return {
    scanned: candidates.length + recoveryCandidates.length,
    movedToMaintenance,
    movedToRetired,
    movedToActive,
    updatedVehicleIds,
  };
}

export async function getFleetDispatchBoardSvc(input: { companyId: string }) {
  return getFleetDispatchBoardMetricsRepo(input.companyId);
}

export async function listFleetDispatchRouteAssignmentQueueSvc(input: {
  companyId: string;
  branchId?: string | null;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(1000, input.limit ?? 300));
  const { data } = await listFleetTripsRepo({
    companyId: input.companyId,
    status: null,
    search: null,
    vehicleId: null,
    driverEmployeeId: null,
    limit,
    offset: 0,
  });

  const planned = data.filter((row) => row.status === FleetTripStatus.PLANNED);
  const rows = input.branchId ? planned.filter((row) => row.branchId === input.branchId) : planned;

  const queue = rows.map((row) => {
    const scheduleComplete = !!row.plannedStartAt && !!row.plannedEndAt;
    let vehicleConflict = false;
    let driverConflict = false;

    for (const other of data) {
      if (other.id === row.id) continue;
      if (
        other.status !== FleetTripStatus.PLANNED &&
        other.status !== FleetTripStatus.IN_PROGRESS
      ) {
        continue;
      }
      const sameVehicle = row.vehicleId === other.vehicleId;
      const sameDriver = row.driverEmployeeId === other.driverEmployeeId;
      if (!sameVehicle && !sameDriver) continue;

      if (other.status === FleetTripStatus.IN_PROGRESS) {
        if (sameVehicle) vehicleConflict = true;
        if (sameDriver) driverConflict = true;
        continue;
      }

      if (
        !row.plannedStartAt ||
        !row.plannedEndAt ||
        !other.plannedStartAt ||
        !other.plannedEndAt
      ) {
        continue;
      }
      const overlap =
        row.plannedStartAt.getTime() < other.plannedEndAt.getTime() &&
        row.plannedEndAt.getTime() > other.plannedStartAt.getTime();
      if (!overlap) continue;
      if (sameVehicle) vehicleConflict = true;
      if (sameDriver) driverConflict = true;
    }

    return {
      ...row,
      scheduleComplete,
      routeAssigned: !!row.routePlanId,
      vehicleConflict,
      driverConflict,
      hasConflict: vehicleConflict || driverConflict,
    };
  });

  return {
    summary: {
      total: queue.length,
      missingRoute: queue.filter((row) => !row.routeAssigned).length,
      missingSchedule: queue.filter((row) => !row.scheduleComplete).length,
      conflicts: queue.filter((row) => row.hasConflict).length,
    },
    data: queue,
  };
}

export async function listFleetDispatchLoadCandidatesSvc(input: {
  companyId: string;
  tripId: string;
  search?: string | null;
  limit?: number;
}) {
  const trip = await getFleetTripByIdRepo(input.tripId, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  if (trip.status === FleetTripStatus.COMPLETED || trip.status === FleetTripStatus.CANCELLED) {
    throw Conflict('Cannot list load candidates for completed or cancelled trips');
  }

  const limit = Math.max(1, Math.min(500, input.limit ?? 100));
  const route = trip.routePlanId
    ? await getFleetRoutePlanByIdRepo(trip.routePlanId, input.companyId)
    : null;
  const rows = await listFleetDispatchLoadCandidatesRepo({
    companyId: input.companyId,
    search: input.search ?? null,
    limit,
  });

  const data = rows.map((row) => {
    const routeAligned = trip.branchId ? row.source_id === trip.branchId : null;
    const assignedToAnotherTrip = !!row.active_trip_id && row.active_trip_id !== input.tripId;
    return {
      parcelId: row.parcel_id,
      sourceId: row.source_id,
      destinationId: row.destination_id,
      parcelStatus: row.parcel_status,
      bookingCode: row.booking_code,
      trackingCode: row.tracking_code,
      activeTripId: row.active_trip_id,
      activeLoadStatus: row.active_load_status,
      assignedToAnotherTrip,
      routeAligned,
      assignmentBlockedReason: assignedToAnotherTrip
        ? 'Parcel is actively assigned to another trip'
        : null,
    };
  });

  return {
    summary: {
      total: data.length,
      available: data.filter((row) => !row.assignedToAnotherTrip).length,
      assignedElsewhere: data.filter((row) => row.assignedToAnotherTrip).length,
      routeAligned: data.filter((row) => row.routeAligned === true).length,
      routeContext: route
        ? {
            routePlanId: route.id,
            routePlanName: route.name,
          }
        : null,
    },
    data,
  };
}

export async function listFleetTripLoadAuditTrailSvc(input: {
  companyId: string;
  tripId: string;
  limit?: number;
}) {
  const trip = await getFleetTripByIdRepo(input.tripId, input.companyId);
  if (!trip) throw NotFound('Trip not found');
  const limit = Math.max(1, Math.min(500, input.limit ?? 200));
  return listFleetTripLoadAuditTrailRepo({
    companyId: input.companyId,
    tripId: input.tripId,
    limit,
  });
}

export async function getFleetDispatchOpsPerformanceSvc(input: {
  companyId: string;
  windowDays?: number;
}) {
  const windowDays = Math.max(1, Math.min(180, input.windowDays ?? 30));
  const now = Date.now();
  const windowStart = new Date(now - windowDays * 24 * 60 * 60 * 1000);
  const metrics = await getFleetDispatchOpsPerformanceRepo({
    companyId: input.companyId,
    windowStart,
  });

  const routeAssignmentCoveragePct =
    metrics.tripStats.plannedTrips > 0
      ? (metrics.tripStats.plannedTripsWithRoute / metrics.tripStats.plannedTrips) * 100
      : 100;
  const onTimeCompletionPct =
    metrics.tripStats.completedTrips > 0
      ? (metrics.tripStats.onTimeCompletedTrips / metrics.tripStats.completedTrips) * 100
      : 0;
  const checkOutCoveragePct =
    metrics.tripStats.completedTrips > 0
      ? (metrics.checkEventStats.tripsWithCheckOut / metrics.tripStats.completedTrips) * 100
      : 0;

  return {
    summary: {
      windowDays,
      routeAssignmentCoveragePct,
      onTimeCompletionPct,
      checkOutCoveragePct,
      delayedUpdates: metrics.statusUpdateStats.delayedUpdates,
      stoppedUpdates: metrics.statusUpdateStats.stoppedUpdates,
    },
    tripStats: metrics.tripStats,
    checkEventStats: metrics.checkEventStats,
    statusUpdateStats: metrics.statusUpdateStats,
    loadStats: metrics.loadStats,
  };
}

export async function getFleetDispatchExceptionQueueSvc(input: {
  companyId: string;
  branchId?: string | null;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(500, input.limit ?? 200));
  const now = Date.now();
  const [routeQueue, inProgressTrips] = await Promise.all([
    listFleetDispatchRouteAssignmentQueueSvc({
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      limit,
    }),
    listFleetTripsRepo({
      companyId: input.companyId,
      status: FleetTripStatus.IN_PROGRESS,
      limit: Math.max(200, limit),
      offset: 0,
      search: null,
      vehicleId: null,
      driverEmployeeId: null,
    }),
  ]);

  const routeExceptions = routeQueue.data
    .filter((row) => !row.scheduleComplete || !row.routeAssigned || row.hasConflict)
    .map((row) => ({
      tripId: row.id,
      tripNo: row.tripNo,
      branchId: row.branchId,
      branchName: row.branchName,
      vehicleId: row.vehicleId,
      vehiclePlateNumber: row.vehiclePlateNumber,
      driverEmployeeId: row.driverEmployeeId,
      driverEmployeeName: row.driverEmployeeName,
      status: row.status,
      category: !row.scheduleComplete
        ? ('missing_schedule' as const)
        : !row.routeAssigned
          ? ('route_unassigned' as const)
          : ('resource_conflict' as const),
      reason: !row.scheduleComplete
        ? 'Planned start/end is incomplete'
        : !row.routeAssigned
          ? 'Route plan not assigned'
          : row.vehicleConflict
            ? 'Vehicle has overlapping planned slot'
            : 'Driver has overlapping planned slot',
      plannedStartAt: row.plannedStartAt,
      plannedEndAt: row.plannedEndAt,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
    }));

  const delayedExceptions = inProgressTrips.data
    .filter((row) => row.plannedEndAt && row.plannedEndAt.getTime() < now)
    .map((row) => ({
      tripId: row.id,
      tripNo: row.tripNo,
      branchId: row.branchId,
      branchName: row.branchName,
      vehicleId: row.vehicleId,
      vehiclePlateNumber: row.vehiclePlateNumber,
      driverEmployeeId: row.driverEmployeeId,
      driverEmployeeName: row.driverEmployeeName,
      status: row.status,
      category: 'delayed_in_progress' as const,
      reason: 'In-progress trip exceeded planned end time',
      plannedStartAt: row.plannedStartAt,
      plannedEndAt: row.plannedEndAt,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
    }));

  const dedup = new Map<string, (typeof routeExceptions)[number]>();
  for (const item of [...routeExceptions, ...delayedExceptions]) {
    const key = `${item.tripId}:${item.category}`;
    if (!dedup.has(key)) dedup.set(key, item);
  }
  const data = Array.from(dedup.values())
    .sort((a, b) => {
      const aTime = a.plannedEndAt?.getTime() ?? a.plannedStartAt?.getTime() ?? 0;
      const bTime = b.plannedEndAt?.getTime() ?? b.plannedStartAt?.getTime() ?? 0;
      return aTime - bTime;
    })
    .slice(0, limit);

  return {
    summary: {
      total: data.length,
      missingSchedule: data.filter((row) => row.category === 'missing_schedule').length,
      routeUnassigned: data.filter((row) => row.category === 'route_unassigned').length,
      resourceConflict: data.filter((row) => row.category === 'resource_conflict').length,
      delayedInProgress: data.filter((row) => row.category === 'delayed_in_progress').length,
    },
    data,
  };
}

export async function getFleetDecisionSupportSvc(input: {
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  expectedOveruseThresholdPct?: number;
  defaultExpectedKmPerLiter?: number;
}) {
  const [fuel, dispatch] = await Promise.all([
    listFleetFuelAnalyticsSvc({
      companyId: input.companyId,
      vehicleId: null,
      dateFrom: input.dateFrom ?? null,
      dateTo: input.dateTo ?? null,
      limit: 400,
      expectedOveruseThresholdPct: input.expectedOveruseThresholdPct ?? 20,
      defaultExpectedKmPerLiter: input.defaultExpectedKmPerLiter ?? 6,
    }),
    getFleetDispatchBoardMetricsRepo(input.companyId),
  ]);

  const tripIds = fuel.data.map((row) => row.tripId);
  const [loadCounts, customerStats] = await Promise.all([
    listFleetTripLoadCountsRepo(input.companyId, tripIds),
    listFleetTripCustomerStatsRepo(input.companyId, tripIds),
  ]);
  const loadCountMap = new Map(loadCounts.map((row) => [row.tripId, Number(row.parcelCount ?? 0)]));
  const customerByTrip = new Map<
    string,
    Array<{ senderId: string; senderName: string | null; parcelCount: number; revenuePsw: number }>
  >();
  for (const row of customerStats) {
    const existing = customerByTrip.get(row.tripId) ?? [];
    existing.push({
      senderId: row.senderId,
      senderName: row.senderName,
      parcelCount: Number(row.parcelCount ?? 0),
      revenuePsw: Number(row.revenuePsw ?? 0),
    });
    customerByTrip.set(row.tripId, existing);
  }

  const completedTrips = fuel.summary.tripsAnalyzed;
  const onTimeTrips = fuel.data.filter((item) => {
    if (!item.plannedEndAt) return false;
    const end = new Date(item.endedAt).getTime();
    const plannedEnd = new Date(item.plannedEndAt).getTime();
    return Number.isFinite(end) && Number.isFinite(plannedEnd) && end <= plannedEnd;
  }).length;

  const byDriver = new Map<
    string,
    {
      driverEmployeeId: string;
      driverEmployeeName: string | null;
      trips: number;
      anomalyCount: number;
      totalVariancePct: number;
      onTimeTrips: number;
    }
  >();

  const byRoute = new Map<
    string,
    {
      routePlanId: string | null;
      routePlanName: string | null;
      trips: number;
      totalDistanceKm: number;
      totalFuelCostPsw: number;
      totalParcelCount: number;
    }
  >();
  const byBranch = new Map<
    string,
    {
      branchId: string | null;
      branchName: string | null;
      trips: number;
      totalDistanceKm: number;
      totalFuelCostPsw: number;
      totalParcelCount: number;
    }
  >();
  const byCustomer = new Map<
    string,
    {
      senderId: string;
      senderName: string | null;
      trips: number;
      totalParcelCount: number;
      totalRevenuePsw: number;
      totalFuelCostPsw: number;
    }
  >();
  const trendByMonth = new Map<
    string,
    {
      month: string;
      trips: number;
      totalFuelCostPsw: number;
      totalDistanceKm: number;
      totalParcelCount: number;
      totalRevenuePsw: number;
    }
  >();

  for (const row of fuel.data) {
    const driverKey = row.driverEmployeeId ?? 'unassigned';
    const curDriver = byDriver.get(driverKey) ?? {
      driverEmployeeId: row.driverEmployeeId ?? 'unassigned',
      driverEmployeeName: row.driverEmployeeName ?? null,
      trips: 0,
      anomalyCount: 0,
      totalVariancePct: 0,
      onTimeTrips: 0,
    };
    curDriver.trips += 1;
    if (row.anomaly) curDriver.anomalyCount += 1;
    curDriver.totalVariancePct += row.variancePct;
    if (row.plannedEndAt) {
      const end = new Date(row.endedAt).getTime();
      const plannedEnd = new Date(row.plannedEndAt).getTime();
      if (Number.isFinite(end) && Number.isFinite(plannedEnd) && end <= plannedEnd) {
        curDriver.onTimeTrips += 1;
      }
    }
    byDriver.set(driverKey, curDriver);

    const routeKey = row.routePlanId ?? 'unassigned';
    const curRoute = byRoute.get(routeKey) ?? {
      routePlanId: row.routePlanId ?? null,
      routePlanName: row.routePlanName ?? null,
      trips: 0,
      totalDistanceKm: 0,
      totalFuelCostPsw: 0,
      totalParcelCount: 0,
    };
    curRoute.trips += 1;
    curRoute.totalDistanceKm += row.distanceKm;
    curRoute.totalFuelCostPsw += row.fuelCostPsw;
    curRoute.totalParcelCount += loadCountMap.get(row.tripId) ?? 0;
    byRoute.set(routeKey, curRoute);

    const branchKey = row.branchId ?? 'unassigned';
    const curBranch = byBranch.get(branchKey) ?? {
      branchId: row.branchId ?? null,
      branchName: row.branchName ?? null,
      trips: 0,
      totalDistanceKm: 0,
      totalFuelCostPsw: 0,
      totalParcelCount: 0,
    };
    curBranch.trips += 1;
    curBranch.totalDistanceKm += row.distanceKm;
    curBranch.totalFuelCostPsw += row.fuelCostPsw;
    curBranch.totalParcelCount += loadCountMap.get(row.tripId) ?? 0;
    byBranch.set(branchKey, curBranch);

    const monthKey = new Date(row.endedAt).toISOString().slice(0, 7);
    const curMonth = trendByMonth.get(monthKey) ?? {
      month: monthKey,
      trips: 0,
      totalFuelCostPsw: 0,
      totalDistanceKm: 0,
      totalParcelCount: 0,
      totalRevenuePsw: 0,
    };
    curMonth.trips += 1;
    curMonth.totalFuelCostPsw += row.fuelCostPsw;
    curMonth.totalDistanceKm += row.distanceKm;
    curMonth.totalParcelCount += loadCountMap.get(row.tripId) ?? 0;
    const customerRows = customerByTrip.get(row.tripId) ?? [];
    for (const customerRow of customerRows) {
      const customerKey = customerRow.senderId;
      const curCustomer = byCustomer.get(customerKey) ?? {
        senderId: customerRow.senderId,
        senderName: customerRow.senderName,
        trips: 0,
        totalParcelCount: 0,
        totalRevenuePsw: 0,
        totalFuelCostPsw: 0,
      };
      curCustomer.trips += 1;
      curCustomer.totalParcelCount += customerRow.parcelCount;
      curCustomer.totalRevenuePsw += customerRow.revenuePsw;
      curCustomer.totalFuelCostPsw += row.fuelCostPsw;
      byCustomer.set(customerKey, curCustomer);

      curMonth.totalRevenuePsw += customerRow.revenuePsw;
    }
    trendByMonth.set(monthKey, curMonth);
  }

  const profitabilityByRoute = Array.from(byRoute.values()).map((value) => {
    const costPerKm =
      value.totalDistanceKm > 0 ? value.totalFuelCostPsw / value.totalDistanceKm : 0;
    const costPerTrip = value.trips > 0 ? value.totalFuelCostPsw / value.trips : 0;
    const costPerParcel =
      value.totalParcelCount > 0 ? value.totalFuelCostPsw / value.totalParcelCount : 0;
    return {
      routePlanId: value.routePlanId,
      routePlanName: value.routePlanName,
      trips: value.trips,
      totalDistanceKm: value.totalDistanceKm,
      totalFuelCostPsw: value.totalFuelCostPsw,
      totalParcelCount: value.totalParcelCount,
      costPerKm,
      costPerTrip,
      costPerParcel,
    };
  });

  const driverScorecards = Array.from(byDriver.values()).map((value) => ({
    driverEmployeeId: value.driverEmployeeId,
    driverEmployeeName: value.driverEmployeeName,
    trips: value.trips,
    anomalyCount: value.anomalyCount,
    averageVariancePct: value.trips ? value.totalVariancePct / value.trips : 0,
    onTimePct: value.trips ? (value.onTimeTrips / value.trips) * 100 : 0,
  }));

  const profitabilityByBranch = Array.from(byBranch.values()).map((value) => {
    const costPerKm =
      value.totalDistanceKm > 0 ? value.totalFuelCostPsw / value.totalDistanceKm : 0;
    const costPerTrip = value.trips > 0 ? value.totalFuelCostPsw / value.trips : 0;
    const costPerParcel =
      value.totalParcelCount > 0 ? value.totalFuelCostPsw / value.totalParcelCount : 0;
    return {
      branchId: value.branchId,
      branchName: value.branchName,
      trips: value.trips,
      totalDistanceKm: value.totalDistanceKm,
      totalFuelCostPsw: value.totalFuelCostPsw,
      totalParcelCount: value.totalParcelCount,
      costPerKm,
      costPerTrip,
      costPerParcel,
    };
  });

  const profitabilityByCustomer = Array.from(byCustomer.values()).map((value) => {
    const revenuePerParcel =
      value.totalParcelCount > 0 ? value.totalRevenuePsw / value.totalParcelCount : 0;
    const marginPsw = value.totalRevenuePsw - value.totalFuelCostPsw;
    return {
      senderId: value.senderId,
      senderName: value.senderName,
      trips: value.trips,
      totalParcelCount: value.totalParcelCount,
      totalRevenuePsw: value.totalRevenuePsw,
      totalFuelCostPsw: value.totalFuelCostPsw,
      marginPsw,
      revenuePerParcel,
    };
  });

  const monthlyTrends = Array.from(trendByMonth.values())
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0))
    .slice(-12)
    .map((value) => ({
      month: value.month,
      trips: value.trips,
      totalFuelCostPsw: value.totalFuelCostPsw,
      totalDistanceKm: value.totalDistanceKm,
      totalParcelCount: value.totalParcelCount,
      totalRevenuePsw: value.totalRevenuePsw,
      costPerTrip: value.trips > 0 ? value.totalFuelCostPsw / value.trips : 0,
      costPerParcel:
        value.totalParcelCount > 0 ? value.totalFuelCostPsw / value.totalParcelCount : 0,
      revenuePerParcel:
        value.totalParcelCount > 0 ? value.totalRevenuePsw / value.totalParcelCount : 0,
    }));

  return {
    utilization: {
      plannedTrips: dispatch.tripCounts.planned,
      inProgressTrips: dispatch.tripCounts.inProgress,
      completedTrips: dispatch.tripCounts.completed,
    },
    onTimePerformance: {
      completedTrips,
      onTimeTrips,
      onTimePct: completedTrips ? (onTimeTrips / completedTrips) * 100 : 0,
    },
    profitabilityByRoute,
    profitabilityByBranch,
    profitabilityByCustomer,
    monthlyTrends,
    driverScorecards,
  };
}

export async function getFleetExecutiveScorecardSvc(input: {
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  expectedOveruseThresholdPct?: number;
  defaultExpectedKmPerLiter?: number;
  onTimeTargetPct?: number;
  routeCoverageTargetPct?: number;
  checkOutCoverageTargetPct?: number;
  mttrTargetHours?: number;
}) {
  const onTimeTargetPct = Math.max(0, Math.min(100, input.onTimeTargetPct ?? 92));
  const routeCoverageTargetPct = Math.max(0, Math.min(100, input.routeCoverageTargetPct ?? 95));
  const checkOutCoverageTargetPct = Math.max(
    0,
    Math.min(100, input.checkOutCoverageTargetPct ?? 95),
  );
  const mttrTargetHours = Math.max(1, Math.min(24 * 30, input.mttrTargetHours ?? 48));

  const [decision, dispatchOps, maintenanceKpi] = await Promise.all([
    getFleetDecisionSupportSvc({
      companyId: input.companyId,
      dateFrom: input.dateFrom ?? null,
      dateTo: input.dateTo ?? null,
      expectedOveruseThresholdPct: input.expectedOveruseThresholdPct ?? 20,
      defaultExpectedKmPerLiter: input.defaultExpectedKmPerLiter ?? 6,
    }),
    getFleetDispatchOpsPerformanceSvc({
      companyId: input.companyId,
      windowDays: 60,
    }),
    getFleetMaintenanceKpiDashboardSvc({
      companyId: input.companyId,
      windowDays: 60,
      slaHours: Math.round(mttrTargetHours),
    }),
  ]);

  const mttrActualHours =
    typeof maintenanceKpi.summary.meanTimeToRepairHours === 'number'
      ? maintenanceKpi.summary.meanTimeToRepairHours
      : null;

  const kpis = [
    {
      key: 'on_time',
      label: 'On-Time Completion %',
      actual: decision.onTimePerformance.onTimePct,
      target: onTimeTargetPct,
      meetsTarget: decision.onTimePerformance.onTimePct >= onTimeTargetPct,
      direction: 'higher_is_better' as const,
    },
    {
      key: 'route_coverage',
      label: 'Route Assignment Coverage %',
      actual: dispatchOps.summary.routeAssignmentCoveragePct,
      target: routeCoverageTargetPct,
      meetsTarget: dispatchOps.summary.routeAssignmentCoveragePct >= routeCoverageTargetPct,
      direction: 'higher_is_better' as const,
    },
    {
      key: 'checkout_coverage',
      label: 'Check-Out Coverage %',
      actual: dispatchOps.summary.checkOutCoveragePct,
      target: checkOutCoverageTargetPct,
      meetsTarget: dispatchOps.summary.checkOutCoveragePct >= checkOutCoverageTargetPct,
      direction: 'higher_is_better' as const,
    },
    {
      key: 'mttr',
      label: 'Mean Time To Repair (hours)',
      actual: mttrActualHours,
      target: mttrTargetHours,
      meetsTarget: typeof mttrActualHours === 'number' ? mttrActualHours <= mttrTargetHours : false,
      direction: 'lower_is_better' as const,
    },
  ];

  const metTargets = kpis.filter((item) => item.meetsTarget).length;
  const overallStatus =
    metTargets === kpis.length
      ? 'healthy'
      : metTargets >= Math.ceil(kpis.length / 2)
        ? 'watch'
        : 'critical';

  const topDriverRisks = [...decision.driverScorecards]
    .sort((a, b) => b.anomalyCount - a.anomalyCount || b.averageVariancePct - a.averageVariancePct)
    .slice(0, 10);
  const topRouteCostRisks = [...decision.profitabilityByRoute]
    .sort((a, b) => b.costPerKm - a.costPerKm)
    .slice(0, 10);

  return {
    summary: {
      overallStatus,
      metTargets,
      totalTargets: kpis.length,
    },
    targets: {
      onTimeTargetPct,
      routeCoverageTargetPct,
      checkOutCoverageTargetPct,
      mttrTargetHours,
    },
    kpis,
    topDriverRisks,
    topRouteCostRisks,
  };
}

export async function getFleetUnitEconomicsSvc(input: {
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  expectedOveruseThresholdPct?: number;
  defaultExpectedKmPerLiter?: number;
}) {
  const overview = await getFleetDecisionSupportSvc({
    companyId: input.companyId,
    dateFrom: input.dateFrom ?? null,
    dateTo: input.dateTo ?? null,
    expectedOveruseThresholdPct: input.expectedOveruseThresholdPct ?? 20,
    defaultExpectedKmPerLiter: input.defaultExpectedKmPerLiter ?? 6,
  });

  const topRouteCostPerKm = [...overview.profitabilityByRoute]
    .sort((a, b) => b.costPerKm - a.costPerKm)
    .slice(0, 10);
  const topBranchCostPerParcel = [...overview.profitabilityByBranch]
    .sort((a, b) => b.costPerParcel - a.costPerParcel)
    .slice(0, 10);
  const lowestMarginCustomers = [...overview.profitabilityByCustomer]
    .sort((a, b) => a.marginPsw - b.marginPsw)
    .slice(0, 10);

  return {
    summary: {
      routeCount: overview.profitabilityByRoute.length,
      branchCount: overview.profitabilityByBranch.length,
      customerCount: overview.profitabilityByCustomer.length,
      trendMonths: overview.monthlyTrends.length,
    },
    profitabilityByRoute: overview.profitabilityByRoute,
    profitabilityByBranch: overview.profitabilityByBranch,
    profitabilityByCustomer: overview.profitabilityByCustomer,
    monthlyTrends: overview.monthlyTrends,
    benchmarkCuts: {
      topRouteCostPerKm,
      topBranchCostPerParcel,
      lowestMarginCustomers,
    },
  };
}

export async function createFleetFuelLogSvc(input: {
  companyId: string;
  loggedByUserId: string;
  branchId?: string | null;
  vehicleId: string;
  liters: number;
  fuelCostPsw: number;
  odometerKm?: number | null;
  stationName?: string | null;
  note?: string | null;
}) {
  const created = await createFleetFuelLogRepo({
    companyId: input.companyId,
    logNo: buildFuelLogNo(),
    branchId: input.branchId ?? null,
    vehicleId: input.vehicleId,
    liters: input.liters,
    fuelCostPsw: input.fuelCostPsw,
    odometerKm: input.odometerKm ?? null,
    stationName: input.stationName ?? null,
    note: input.note ?? null,
    status: FleetFuelLogStatus.SUBMITTED,
    loggedByUserId: input.loggedByUserId,
  });

  if (!created) throw Conflict('Failed to create fuel log');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.loggedByUserId,
    entityType: 'fleet_fuel_log',
    entityId: created.id,
    action: 'FLEET_FUEL_LOG_CREATED',
    message: 'Fuel log created',
    metadata: { liters: input.liters, fuelCostPsw: input.fuelCostPsw },
  });

  return created;
}

export async function approveFleetFuelLogSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  const existing = await getFleetFuelLogByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Fuel log not found');
  if (existing.status !== FleetFuelLogStatus.SUBMITTED) {
    throw Conflict('Only submitted fuel logs can be approved');
  }

  const updated = await updateFleetFuelLogStatusRepo(input.id, input.companyId, {
    status: FleetFuelLogStatus.APPROVED,
    approvedByUserId: input.approverUserId,
    approvedAt: new Date(),
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
  } satisfies Partial<typeof fleetFuelLogs.$inferInsert>);

  if (!updated) throw NotFound('Fuel log not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'fleet_fuel_log',
    entityId: input.id,
    action: 'FLEET_FUEL_LOG_APPROVED',
    message: `Fuel log approved: ${existing.logNo}`,
  });

  return updated;
}

export async function rejectFleetFuelLogSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  const existing = await getFleetFuelLogByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Fuel log not found');
  if (existing.status !== FleetFuelLogStatus.SUBMITTED) {
    throw Conflict('Only submitted fuel logs can be rejected');
  }

  const updated = await updateFleetFuelLogStatusRepo(input.id, input.companyId, {
    status: FleetFuelLogStatus.REJECTED,
    rejectedByUserId: input.approverUserId,
    rejectedAt: new Date(),
    rejectionReason: input.rejectionReason,
    approvedByUserId: null,
    approvedAt: null,
  } satisfies Partial<typeof fleetFuelLogs.$inferInsert>);

  if (!updated) throw NotFound('Fuel log not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'fleet_fuel_log',
    entityId: input.id,
    action: 'FLEET_FUEL_LOG_REJECTED',
    message: `Fuel log rejected: ${existing.logNo}`,
    metadata: { rejectionReason: input.rejectionReason },
  });

  return updated;
}
