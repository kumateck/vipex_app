import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto, PaginatedResponseDto } from '@/server/types/pagination.types';
import {
  assignFleetTripCrewSvc,
  assignFleetTripRouteSvc,
  approveFleetFuelLogSvc,
  closeFleetDowntimeEventSvc,
  createFleetDowntimeEventSvc,
  closeFleetTripSvc,
  createFleetComplianceIncidentSvc,
  createFleetDriverComplianceRecordSvc,
  createFleetMaintenancePartSvc,
  createFleetMaintenancePlanSvc,
  createFleetMaintenanceWorkOrderSvc,
  createFleetRoutePlanSvc,
  createFleetShiftRosterSvc,
  assignFleetTripLoadMatchSvc,
  updateFleetTripLoadMatchStatusSvc,
  recordFleetTripTelemetryPointSvc,
  recordFleetTripStatusUpdateSvc,
  createFleetTripEventSvc,
  createFleetTripSvc,
  createFleetVehicleDocumentSvc,
  createFleetFuelLogSvc,
  createFleetVehicleSvc,
  getFleetVehicleSvc,
  getFleetTripSvc,
  getFleetRoutePlanSvc,
  getFleetShiftRosterSvc,
  getFleetTripCrewSvc,
  listFleetTripEventsSvc,
  listFleetTripLoadMatchesSvc,
  listFleetTripTelemetryPointsSvc,
  listFleetTripStatusUpdatesSvc,
  getFleetTripTimelineSvc,
  listFleetShiftRostersSvc,
  listFleetTripsSvc,
  listFleetRoutePlansSvc,
  listFleetVehicleDocumentsSvc,
  listFleetDriverComplianceAlertsSvc,
  listFleetDriverComplianceRecordsSvc,
  listFleetDriverOptionsSvc,
  listFleetComplianceDashboardSvc,
  listFleetComplianceIncidentsSvc,
  listFleetDowntimeEventsSvc,
  listFleetDowntimeRcaWorkflowsSvc,
  listFleetMaintenancePartsSvc,
  listFleetMaintenancePartMovementsSvc,
  listFleetMaintenancePartMovementsByWorkOrderSvc,
  listFleetMaintenancePlansSvc,
  getFleetMaintenanceKpiDashboardSvc,
  getFleetMaintenanceProcurementTraceabilitySvc,
  getFleetMaintenanceReliabilityTrendsSvc,
  listFleetMaintenanceWorkOrdersSvc,
  listFleetReliabilityMetricsSvc,
  listFleetVehicleComplianceAlertsSvc,
  listFleetFuelAnalyticsSvc,
  getFleetFuelFraudSignalsSvc,
  listFleetFuelLogsSvc,
  getFleetMaintenanceDashboardSvc,
  listFleetVehicleOptionsSvc,
  listFleetVehiclesSvc,
  listFleetPolicyAcknowledgmentsSvc,
  acknowledgeFleetPolicySvc,
  rejectFleetFuelLogSvc,
  runFleetComplianceExpiryAlertJobSvc,
  runFleetComplianceEscalationJobSvc,
  runFleetLowStockAlertJobSvc,
  listFleetLowStockProcurementCandidatesSvc,
  runFleetPolicyReackReminderJobSvc,
  runFleetMaintenanceAutomationJobSvc,
  runFleetMaintenanceReorderDemandJobSvc,
  runFleetAutomationOrchestrationJobSvc,
  runFleetVehicleLifecycleAutomationJobSvc,
  setFleetComplianceEscalationPolicySvc,
  startFleetTripSvc,
  transitionFleetVehicleLifecycleSvc,
  adjustFleetMaintenancePartStockSvc,
  getFleetDispatchBoardSvc,
  getFleetDispatchExceptionQueueSvc,
  getFleetDispatchOpsPerformanceSvc,
  listFleetDispatchLoadCandidatesSvc,
  listFleetDispatchRouteAssignmentQueueSvc,
  getFleetOpsQueueSvc,
  getFleetDecisionSupportSvc,
  getFleetExecutiveScorecardSvc,
  getFleetComplianceEscalationPolicySvc,
  getFleetUnitEconomicsSvc,
  getFleetComplianceKpiTrendsSvc,
  runFleetAnalyticsSnapshotJobSvc,
  listFleetTripLoadAuditTrailSvc,
  updateFleetShiftRosterSvc,
  updateFleetMaintenancePlanSvc,
  updateFleetMaintenanceWorkOrderSvc,
  updateFleetDowntimeRcaWorkflowSvc,
  reopenFleetDowntimeEventSvc,
  transitionFleetComplianceIncidentCaseSvc,
  updateFleetComplianceIncidentSvc,
  updateFleetVehicleSvc,
} from './service';

function toFleetVehicleDto(row: {
  id: string;
  branchId: string | null;
  plateNumber: string;
  model: string;
  year: number | null;
  vin: string | null;
  ownershipType: number;
  lessorName: string | null;
  leaseStartAt: Date | null;
  leaseEndAt: Date | null;
  fuelType: number;
  expectedKmPerLiter: number | null;
  tankCapacityLiters: number | null;
  payloadCapacityKg: number | null;
  cargoCapacityCbm: number | null;
  lifecycleStatus: number;
  insuranceExpiryAt: Date | null;
  roadworthyExpiryAt: Date | null;
  assignedDriverUserId: string | null;
  assignedDriverName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    leaseStartAt: row.leaseStartAt?.toISOString() ?? null,
    leaseEndAt: row.leaseEndAt?.toISOString() ?? null,
    insuranceExpiryAt: row.insuranceExpiryAt?.toISOString() ?? null,
    roadworthyExpiryAt: row.roadworthyExpiryAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetVehicleDocumentDto(row: {
  id: string;
  vehicleId: string;
  documentType: string;
  documentNumber: string | null;
  issuer: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  fileUrl: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    issuedAt: row.issuedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetDriverComplianceRecordDto(row: {
  id: string;
  employeeId: string;
  complianceType: number;
  documentNumber: string | null;
  issuer: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  fileUrl: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    issuedAt: row.issuedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetFuelLogDto(row: {
  id: string;
  logNo: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  liters: number;
  fuelCostPsw: number;
  odometerKm: number | null;
  stationName: string | null;
  note: string | null;
  status: number;
  loggedByUserId: string;
  loggedByName: string | null;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  rejectionReason: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetTripEventDto(row: {
  id: string;
  tripId: string;
  eventType: number;
  occurredAt: Date;
  odometerKm: number | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: Date;
  createdByName: string | null;
}) {
  return {
    ...row,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function toFleetTripLoadMatchDto(row: {
  id: string;
  tripId: string;
  parcelId: string;
  status: number;
  matchedBy: string | null;
  matchedAt: Date;
  loadedAt: Date | null;
  unloadedAt: Date | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  trackingCode: string | null;
  bookingCode: string | null;
  sourceId: string | null;
  destinationId: string | null;
}) {
  return {
    ...row,
    matchedAt: row.matchedAt.toISOString(),
    loadedAt: row.loadedAt?.toISOString() ?? null,
    unloadedAt: row.unloadedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetTripTelemetryDto(row: {
  id: string;
  tripId: string;
  sampledAt: Date;
  latitude: number;
  longitude: number;
  speedKph: number | null;
  headingDeg: number | null;
  altitudeM: number | null;
  accuracyM: number | null;
  source: string | null;
  createdBy: string | null;
  createdAt: Date;
}) {
  return {
    ...row,
    sampledAt: row.sampledAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function toFleetTripStatusUpdateDto(row: {
  id: string;
  tripId: string;
  statusType: number;
  occurredAt: Date;
  locationLabel: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: Date;
  createdByName: string | null;
}) {
  return {
    ...row,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function toFleetTripDto(row: {
  id: string;
  tripNo: string;
  branchId: string | null;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  routePlanId: string | null;
  routePlanName: string | null;
  driverEmployeeId: string;
  driverEmployeeName: string | null;
  plannedStartAt: Date | null;
  plannedEndAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  startOdometerKm: number | null;
  endOdometerKm: number | null;
  status: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    plannedStartAt: row.plannedStartAt?.toISOString() ?? null,
    plannedEndAt: row.plannedEndAt?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetRoutePlanDto(row: {
  id: string;
  branchId: string | null;
  name: string;
  code: string | null;
  originLabel: string | null;
  destinationLabel: string | null;
  distanceKm: number | null;
  estimatedDurationMin: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetMaintenancePlanDto(row: {
  id: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  title: string;
  description: string | null;
  intervalUnit: number;
  intervalValue: number;
  lastServiceAt: Date | null;
  lastServiceOdometerKm: number | null;
  nextDueAt: Date | null;
  nextDueOdometerKm: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    lastServiceAt: row.lastServiceAt?.toISOString() ?? null,
    nextDueAt: row.nextDueAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetMaintenanceWorkOrderDto(row: {
  id: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  planId: string | null;
  workOrderNo: string;
  title: string;
  description: string | null;
  openedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  startedOdometerKm: number | null;
  completedOdometerKm: number | null;
  estimatedCostPsw: number;
  actualCostPsw: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    openedAt: row.openedAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFleetDowntimeEventDto(row: {
  id: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  workOrderId: string | null;
  reason: string;
  note: string | null;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listFleetVehiclesCtrl(
  q: PaginationRequestDto<{ companyId: string; search?: string; isActive?: boolean }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toFleetVehicleDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetVehiclesSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    isActive: q.filters?.isActive ?? null,
  });

  return {
    data: data.map(toFleetVehicleDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function listFleetVehicleOptionsCtrl(input: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  return listFleetVehicleOptionsSvc(input);
}

export async function createFleetVehicleCtrl(input: {
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
  return createFleetVehicleSvc(input);
}

export async function getFleetVehicleCtrl(input: { id: string; companyId: string }) {
  const row = await getFleetVehicleSvc(input);
  return toFleetVehicleDto(row);
}

export async function listFleetVehicleDocumentsCtrl(input: {
  companyId: string;
  vehicleId: string;
}) {
  const rows = await listFleetVehicleDocumentsSvc(input);
  return rows.map(toFleetVehicleDocumentDto);
}

export async function createFleetVehicleDocumentCtrl(input: {
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
  return createFleetVehicleDocumentSvc(input);
}

export async function listFleetVehicleComplianceAlertsCtrl(input: {
  companyId: string;
  horizonDays?: number;
  limit?: number;
}) {
  const data = await listFleetVehicleComplianceAlertsSvc(input);
  const summary = {
    total: data.length,
    expired: data.filter((item) => item.severity === 'expired').length,
    dueSoon: data.filter((item) => item.severity === 'due_soon').length,
  };

  return {
    data: data.map((item) => ({
      ...item,
      dueAt: item.dueAt.toISOString(),
    })),
    summary,
  };
}

export async function listFleetDriverOptionsCtrl(input: {
  companyId: string;
  search?: string | null;
}) {
  return listFleetDriverOptionsSvc(input);
}

export async function listFleetDriverComplianceRecordsCtrl(input: {
  companyId: string;
  employeeId: string;
}) {
  const rows = await listFleetDriverComplianceRecordsSvc(input);
  return rows.map(toFleetDriverComplianceRecordDto);
}

export async function createFleetDriverComplianceRecordCtrl(input: {
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
  return createFleetDriverComplianceRecordSvc(input);
}

export async function listFleetDriverComplianceAlertsCtrl(input: {
  companyId: string;
  horizonDays?: number;
  limit?: number;
}) {
  const data = await listFleetDriverComplianceAlertsSvc(input);
  const summary = {
    total: data.length,
    expired: data.filter((item) => item.severity === 'expired').length,
    dueSoon: data.filter((item) => item.severity === 'due_soon').length,
  };

  return {
    data: data.map((item) => ({
      ...item,
      dueAt: item.dueAt.toISOString(),
    })),
    summary,
  };
}

export async function listFleetComplianceDashboardCtrl(input: {
  companyId: string;
  horizonDays?: number;
  limit?: number;
  branchId?: string | null;
  status?: 'all' | 'expired' | 'due_7' | 'due_30' | 'due_60';
}) {
  const result = await listFleetComplianceDashboardSvc(input);
  return {
    summary: result.summary,
    data: result.data.map((item) => ({
      ...item,
      dueAt: item.dueAt.toISOString(),
    })),
  };
}

export async function getFleetComplianceKpiTrendsCtrl(input: {
  companyId: string;
  windowDays?: number;
}) {
  return getFleetComplianceKpiTrendsSvc(input);
}

export async function runFleetComplianceExpiryAlertJobCtrl(input: {
  companyId: string;
  actorUserId: string;
  horizonDays?: number;
  recipientLimit?: number;
  maxAlertsInDigest?: number;
}) {
  return runFleetComplianceExpiryAlertJobSvc(input);
}

export async function listFleetMaintenancePlansCtrl(input: {
  companyId: string;
  vehicleId?: string | null;
  isActive?: boolean | null;
}) {
  const rows = await listFleetMaintenancePlansSvc(input);
  return rows.map(toFleetMaintenancePlanDto);
}

export async function createFleetMaintenancePlanCtrl(input: {
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
  return createFleetMaintenancePlanSvc(input);
}

export async function updateFleetMaintenancePlanCtrl(input: {
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
  return updateFleetMaintenancePlanSvc(input);
}

export async function listFleetMaintenanceWorkOrdersCtrl(input: {
  companyId: string;
  vehicleId?: string | null;
  status?: number | null;
}) {
  const rows = await listFleetMaintenanceWorkOrdersSvc(input);
  return rows.map(toFleetMaintenanceWorkOrderDto);
}

export async function createFleetMaintenanceWorkOrderCtrl(input: {
  companyId: string;
  actorUserId: string;
  vehicleId: string;
  planId?: string | null;
  title: string;
  description?: string | null;
  estimatedCostPsw?: number;
}) {
  return createFleetMaintenanceWorkOrderSvc(input);
}

export async function updateFleetMaintenanceWorkOrderCtrl(input: {
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
  return updateFleetMaintenanceWorkOrderSvc(input);
}

export async function listFleetDowntimeEventsCtrl(input: {
  companyId: string;
  vehicleId?: string | null;
  openOnly?: boolean | null;
}) {
  const rows = await listFleetDowntimeEventsSvc(input);
  return rows.map(toFleetDowntimeEventDto);
}

export async function listFleetDowntimeRcaWorkflowsCtrl(input: {
  companyId: string;
  vehicleId?: string | null;
  openOnly?: boolean | null;
  lifecycleStatus?: number | null;
}) {
  const rows = await listFleetDowntimeRcaWorkflowsSvc(input);
  return rows.map((row) => ({
    ...toFleetDowntimeEventDto(row),
    workflow: row.workflow,
  }));
}

export async function updateFleetDowntimeRcaWorkflowCtrl(input: {
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
  return updateFleetDowntimeRcaWorkflowSvc(input);
}

export async function reopenFleetDowntimeEventCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  reason?: string | null;
}) {
  return reopenFleetDowntimeEventSvc(input);
}

export async function createFleetDowntimeEventCtrl(input: {
  companyId: string;
  actorUserId: string;
  vehicleId: string;
  workOrderId?: string | null;
  reason: string;
  note?: string | null;
  startedAt?: Date | null;
}) {
  return createFleetDowntimeEventSvc(input);
}

export async function closeFleetDowntimeEventCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  endedAt?: Date | null;
  note?: string | null;
}) {
  return closeFleetDowntimeEventSvc(input);
}

export async function listFleetReliabilityMetricsCtrl(input: {
  companyId: string;
  vehicleId?: string | null;
}) {
  return listFleetReliabilityMetricsSvc(input);
}

export async function getFleetMaintenanceReliabilityTrendsCtrl(input: {
  companyId: string;
  windowDays?: number;
}) {
  return getFleetMaintenanceReliabilityTrendsSvc(input);
}

export async function getFleetMaintenanceKpiDashboardCtrl(input: {
  companyId: string;
  windowDays?: number;
  slaHours?: number;
}) {
  return getFleetMaintenanceKpiDashboardSvc(input);
}

export async function getFleetMaintenanceDashboardCtrl(input: {
  companyId: string;
  horizonDays?: number;
}) {
  const result = await getFleetMaintenanceDashboardSvc(input);
  return {
    summary: result.summary,
    overduePlans: result.overduePlans.map(toFleetMaintenancePlanDto),
    dueSoonPlans: result.dueSoonPlans.map(toFleetMaintenancePlanDto),
    openWorkOrders: result.openWorkOrders.map(toFleetMaintenanceWorkOrderDto),
    activeDowntimeEvents: result.activeDowntimeEvents.map(toFleetDowntimeEventDto),
    reliability: result.reliability,
  };
}

export async function listFleetMaintenanceWorkOrderPartMovementsCtrl(input: {
  companyId: string;
  workOrderId: string;
  limit?: number;
}) {
  const rows = await listFleetMaintenancePartMovementsByWorkOrderSvc(input);
  return rows.map((row) => ({
    ...row,
    movedAt: row.movedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getFleetMaintenanceProcurementTraceabilityCtrl(input: {
  companyId: string;
  branchId?: string | null;
  limit?: number;
}) {
  const result = await getFleetMaintenanceProcurementTraceabilitySvc(input);
  return {
    summary: result.summary,
    data: result.data.map((row) => ({
      ...row,
      latestDemandUpdatedAt: row.latestDemandUpdatedAt?.toISOString() ?? null,
      lastReceiptAt: row.lastReceiptAt?.toISOString() ?? null,
      lastIssuedAt: row.lastIssuedAt?.toISOString() ?? null,
    })),
  };
}

export async function runFleetMaintenanceReorderDemandJobCtrl(input: {
  companyId: string;
  actorUserId: string;
  dueWithinDays?: number;
  lowStockLimit?: number;
  replenishMultiplier?: number;
}) {
  return runFleetMaintenanceReorderDemandJobSvc(input);
}

export async function updateFleetVehicleCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    branchId?: string | null;
    plateNumber?: string;
    model?: string;
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
    isActive?: boolean;
  };
}) {
  return updateFleetVehicleSvc(input);
}

export async function listFleetFuelAnalyticsCtrl(input: {
  companyId: string;
  vehicleId?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
  expectedOveruseThresholdPct?: number;
  defaultExpectedKmPerLiter?: number;
}) {
  const result = await listFleetFuelAnalyticsSvc(input);
  return {
    summary: result.summary,
    data: result.data.map((item) => ({
      ...item,
      startedAt: item.startedAt.toISOString(),
      endedAt: item.endedAt.toISOString(),
    })),
  };
}

export async function getFleetFuelFraudSignalsCtrl(input: {
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
  const result = await getFleetFuelFraudSignalsSvc(input);
  return {
    summary: result.summary,
    data: result.data.map((item) => ({
      ...item,
      startedAt: item.startedAt.toISOString(),
      endedAt: item.endedAt.toISOString(),
    })),
  };
}

export async function listFleetFuelLogsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    status?: number;
    vehicleId?: string;
    pendingOnly?: boolean;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toFleetFuelLogDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetFuelLogsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    status: q.filters?.status ?? null,
    vehicleId: q.filters?.vehicleId ?? null,
    pendingOnly: q.filters?.pendingOnly ?? null,
  });

  return {
    data: data.map(toFleetFuelLogDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createFleetFuelLogCtrl(input: {
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
  return createFleetFuelLogSvc(input);
}

export async function listFleetTripsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    status?: number;
    vehicleId?: string;
    driverEmployeeId?: string;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toFleetTripDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetTripsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    status: q.filters?.status ?? null,
    vehicleId: q.filters?.vehicleId ?? null,
    driverEmployeeId: q.filters?.driverEmployeeId ?? null,
  });

  return {
    data: data.map(toFleetTripDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createFleetTripCtrl(input: {
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
  return createFleetTripSvc(input);
}

export async function listFleetRoutePlansCtrl(input: {
  companyId: string;
  isActive?: boolean | null;
  branchId?: string | null;
}) {
  const rows = await listFleetRoutePlansSvc(input);
  return rows.map(toFleetRoutePlanDto);
}

export async function getFleetRoutePlanCtrl(input: { id: string; companyId: string }) {
  const route = await getFleetRoutePlanSvc(input);
  return {
    ...toFleetRoutePlanDto(route),
    stops: route.stops.map((stop) => ({
      ...stop,
      createdAt: stop.createdAt.toISOString(),
      updatedAt: stop.updatedAt.toISOString(),
    })),
  };
}

export async function createFleetRoutePlanCtrl(input: {
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
  return createFleetRoutePlanSvc(input);
}

export async function getFleetTripCtrl(input: { id: string; companyId: string }) {
  const trip = await getFleetTripSvc(input);
  return toFleetTripDto(trip);
}

export async function assignFleetTripCrewCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  crewEmployeeIds: string[];
}) {
  return assignFleetTripCrewSvc(input);
}

export async function assignFleetTripRouteCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  routePlanId?: string | null;
}) {
  return assignFleetTripRouteSvc(input);
}

export async function getFleetTripCrewCtrl(input: { id: string; companyId: string }) {
  const rows = await getFleetTripCrewSvc(input);
  return rows.map((row) => ({
    ...row,
    assignedAt: row.assignedAt.toISOString(),
  }));
}

export async function listFleetTripEventsCtrl(input: { id: string; companyId: string }) {
  const rows = await listFleetTripEventsSvc(input);
  return rows.map(toFleetTripEventDto);
}

export async function createFleetTripEventCtrl(input: {
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
  return createFleetTripEventSvc(input);
}

export async function listFleetTripLoadMatchesCtrl(input: { id: string; companyId: string }) {
  const rows = await listFleetTripLoadMatchesSvc(input);
  return rows.map(toFleetTripLoadMatchDto);
}

export async function assignFleetTripLoadMatchCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  parcelId: string;
  note?: string | null;
}) {
  return assignFleetTripLoadMatchSvc(input);
}

export async function updateFleetTripLoadMatchStatusCtrl(input: {
  loadMatchId: string;
  companyId: string;
  actorUserId: string;
  status: number;
  note?: string | null;
}) {
  return updateFleetTripLoadMatchStatusSvc(input);
}

export async function listFleetTripTelemetryCtrl(input: {
  id: string;
  companyId: string;
  limit?: number | null;
}) {
  const rows = await listFleetTripTelemetryPointsSvc(input);
  return rows.map(toFleetTripTelemetryDto);
}

export async function recordFleetTripTelemetryCtrl(input: {
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
  return recordFleetTripTelemetryPointSvc(input);
}

export async function listFleetTripStatusUpdatesCtrl(input: { id: string; companyId: string }) {
  const rows = await listFleetTripStatusUpdatesSvc(input);
  return rows.map(toFleetTripStatusUpdateDto);
}

export async function recordFleetTripStatusUpdateCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  statusType: number;
  occurredAt?: Date | null;
  locationLabel?: string | null;
  note?: string | null;
}) {
  return recordFleetTripStatusUpdateSvc(input);
}

export async function getFleetTripTimelineCtrl(input: { id: string; companyId: string }) {
  const rows = await getFleetTripTimelineSvc(input);
  return rows.map((item) => {
    if (item.kind === 'check_event') {
      return {
        ...item,
        occurredAt: item.occurredAt.toISOString(),
        payload: toFleetTripEventDto(item.payload),
      };
    }
    if (item.kind === 'status_update') {
      return {
        ...item,
        occurredAt: item.occurredAt.toISOString(),
        payload: toFleetTripStatusUpdateDto(item.payload),
      };
    }
    if (item.kind === 'telemetry') {
      return {
        ...item,
        occurredAt: item.occurredAt.toISOString(),
        payload: toFleetTripTelemetryDto(item.payload),
      };
    }
    return {
      ...item,
      occurredAt: item.occurredAt.toISOString(),
      payload: item.payload,
    };
  });
}

export async function listFleetShiftRostersCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    branchId?: string;
    employeeId?: string;
    vehicleId?: string;
    status?: number;
    dateFrom?: string;
    dateTo?: string;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetShiftRostersSvc({
    companyId: q.filters!.companyId,
    branchId: q.filters?.branchId ?? null,
    employeeId: q.filters?.employeeId ?? null,
    vehicleId: q.filters?.vehicleId ?? null,
    status: q.filters?.status ?? null,
    dateFrom: q.filters?.dateFrom ? new Date(q.filters.dateFrom) : null,
    dateTo: q.filters?.dateTo ? new Date(q.filters.dateTo) : null,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });

  return {
    data: data.map((row) => ({
      ...row,
      shiftStartAt: row.shiftStartAt.toISOString(),
      shiftEndAt: row.shiftEndAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getFleetShiftRosterCtrl(input: { id: string; companyId: string }) {
  const row = await getFleetShiftRosterSvc(input);
  return {
    ...row,
    shiftStartAt: row.shiftStartAt.toISOString(),
    shiftEndAt: row.shiftEndAt.toISOString(),
  };
}

export async function createFleetShiftRosterCtrl(input: {
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
  return createFleetShiftRosterSvc(input);
}

export async function updateFleetShiftRosterCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  vehicleId?: string | null;
  status?: number | null;
  shiftStartAt?: Date | null;
  shiftEndAt?: Date | null;
  note?: string | null;
}) {
  return updateFleetShiftRosterSvc(input);
}

export async function transitionFleetVehicleLifecycleCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  lifecycleStatus: number;
  note?: string | null;
}) {
  return transitionFleetVehicleLifecycleSvc(input);
}

export async function listFleetComplianceIncidentsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    incidentType?: number;
    severity?: number;
    caseStatus?: 'open' | 'resolved';
    employeeId?: string;
    vehicleId?: string;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetComplianceIncidentsSvc({
    companyId: q.filters!.companyId,
    incidentType: q.filters?.incidentType ?? null,
    severity: q.filters?.severity ?? null,
    caseStatus: q.filters?.caseStatus ?? null,
    employeeId: q.filters?.employeeId ?? null,
    vehicleId: q.filters?.vehicleId ?? null,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  return {
    data: data.map((row) => ({
      ...row,
      occurredAt: row.occurredAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      caseStatus: row.resolvedAt ? ('resolved' as const) : ('open' as const),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createFleetComplianceIncidentCtrl(input: {
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
  return createFleetComplianceIncidentSvc(input);
}

export async function updateFleetComplianceIncidentCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  severity?: number | null;
  actionTaken?: string | null;
  resolvedAt?: Date | null;
}) {
  return updateFleetComplianceIncidentSvc(input);
}

export async function transitionFleetComplianceIncidentCaseCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  action: 'resolve' | 'reopen';
  actionTaken?: string | null;
  resolvedAt?: Date | null;
}) {
  const result = await transitionFleetComplianceIncidentCaseSvc(input);
  return {
    ...result,
    resolvedAt: result.resolvedAt?.toISOString() ?? null,
  };
}

export async function listFleetPolicyAcknowledgmentsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    policyCode?: string;
    employeeId?: string;
    userId?: string;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetPolicyAcknowledgmentsSvc({
    companyId: q.filters!.companyId,
    policyCode: q.filters?.policyCode ?? null,
    employeeId: q.filters?.employeeId ?? null,
    userId: q.filters?.userId ?? null,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  return {
    data: data.map((row) => ({
      ...row,
      acknowledgedAt: row.acknowledgedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function acknowledgeFleetPolicyCtrl(input: {
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
  return acknowledgeFleetPolicySvc(input);
}

export async function listFleetMaintenancePartsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    branchId?: string;
    isActive?: boolean;
    search?: string;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetMaintenancePartsSvc({
    companyId: q.filters!.companyId,
    branchId: q.filters?.branchId ?? null,
    isActive: q.filters?.isActive ?? null,
    search: q.filters?.search ?? null,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  return {
    data: data.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createFleetMaintenancePartCtrl(input: {
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
  return createFleetMaintenancePartSvc(input);
}

export async function listFleetMaintenancePartMovementsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    partId: string;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listFleetMaintenancePartMovementsSvc({
    companyId: q.filters!.companyId,
    partId: q.filters!.partId,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });

  return {
    data: data.map((row) => ({
      ...row,
      movedAt: row.movedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function adjustFleetMaintenancePartStockCtrl(input: {
  companyId: string;
  actorUserId: string;
  partId: string;
  movementType: number;
  quantity: number;
  unitCostPsw?: number;
  workOrderId?: string | null;
  note?: string | null;
}) {
  return adjustFleetMaintenancePartStockSvc(input);
}

export async function getFleetDispatchBoardCtrl(input: { companyId: string }) {
  return getFleetDispatchBoardSvc(input);
}

export async function getFleetDispatchOpsPerformanceCtrl(input: {
  companyId: string;
  windowDays?: number;
}) {
  return getFleetDispatchOpsPerformanceSvc(input);
}

export async function getFleetDispatchExceptionQueueCtrl(input: {
  companyId: string;
  branchId?: string | null;
  limit?: number;
}) {
  const result = await getFleetDispatchExceptionQueueSvc(input);
  return {
    summary: result.summary,
    data: result.data.map((row) => ({
      ...row,
      plannedStartAt: row.plannedStartAt?.toISOString() ?? null,
      plannedEndAt: row.plannedEndAt?.toISOString() ?? null,
      startedAt: row.startedAt?.toISOString() ?? null,
      endedAt: row.endedAt?.toISOString() ?? null,
    })),
  };
}

export async function listFleetDispatchRouteAssignmentQueueCtrl(input: {
  companyId: string;
  branchId?: string | null;
  limit?: number;
}) {
  const result = await listFleetDispatchRouteAssignmentQueueSvc(input);
  return {
    summary: result.summary,
    data: result.data.map((row) => ({
      ...toFleetTripDto(row),
      scheduleComplete: row.scheduleComplete,
      routeAssigned: row.routeAssigned,
      vehicleConflict: row.vehicleConflict,
      driverConflict: row.driverConflict,
      hasConflict: row.hasConflict,
    })),
  };
}

export async function listFleetDispatchLoadCandidatesCtrl(input: {
  companyId: string;
  tripId: string;
  search?: string | null;
  limit?: number;
}) {
  return listFleetDispatchLoadCandidatesSvc(input);
}

export async function listFleetTripLoadAuditTrailCtrl(input: {
  companyId: string;
  tripId: string;
  limit?: number;
}) {
  const rows = await listFleetTripLoadAuditTrailSvc(input);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getFleetOpsQueueCtrl(input: {
  companyId: string;
  horizonDays?: number;
  incidentLimit?: number;
  workOrderLimit?: number;
  downtimeLimit?: number;
  lowStockLimit?: number;
  policyReackAfterDays?: number;
}) {
  const queue = await getFleetOpsQueueSvc(input);
  return {
    summary: queue.summary,
    queues: {
      complianceAlerts: queue.queues.complianceAlerts.map((item) => ({
        ...item,
        dueAt: item.dueAt.toISOString(),
      })),
      incidents: queue.queues.incidents.map((item) => ({
        ...item,
        occurredAt: item.occurredAt.toISOString(),
      })),
      workOrders: queue.queues.workOrders.map((item) => ({
        ...item,
        openedAt: item.openedAt.toISOString(),
        startedAt: item.startedAt?.toISOString() ?? null,
        completedAt: item.completedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      downtime: queue.queues.downtime.map((item) => ({
        ...item,
        startedAt: item.startedAt.toISOString(),
        endedAt: item.endedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
      lowStockCandidates: queue.queues.lowStockCandidates,
      policyReackTargets: queue.queues.policyReackTargets.map((item) => ({
        ...item,
        acknowledgedAt: item.acknowledgedAt.toISOString(),
      })),
    },
  };
}

export async function getFleetDecisionSupportCtrl(input: {
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  expectedOveruseThresholdPct?: number;
  defaultExpectedKmPerLiter?: number;
}) {
  return getFleetDecisionSupportSvc(input);
}

export async function getFleetUnitEconomicsCtrl(input: {
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  expectedOveruseThresholdPct?: number;
  defaultExpectedKmPerLiter?: number;
}) {
  return getFleetUnitEconomicsSvc(input);
}

export async function getFleetExecutiveScorecardCtrl(input: {
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
  return getFleetExecutiveScorecardSvc(input);
}

export async function getFleetComplianceEscalationPolicyCtrl(input: { companyId: string }) {
  return getFleetComplianceEscalationPolicySvc(input);
}

export async function setFleetComplianceEscalationPolicyCtrl(input: {
  companyId: string;
  actorUserId: string;
  policy: {
    incidentEscalateAfterDays?: number;
    incidentCriticalEscalateAfterDays?: number;
    complianceEscalateAfterDays?: number;
    policyReackAfterDays?: number;
    incidentLimit?: number;
    recipientLimit?: number;
  };
}) {
  return setFleetComplianceEscalationPolicySvc(input);
}

export async function runFleetAnalyticsSnapshotJobCtrl(input: {
  companyId: string;
  actorUserId: string;
  windowDays?: number;
  horizonDays?: number;
  defaultExpectedKmPerLiter?: number;
  expectedOveruseThresholdPct?: number;
}) {
  return runFleetAnalyticsSnapshotJobSvc(input);
}

export async function runFleetLowStockAlertJobCtrl(input: {
  companyId: string;
  actorUserId: string;
  recipientLimit?: number;
  partLimit?: number;
  branchId?: string | null;
}) {
  return runFleetLowStockAlertJobSvc(input);
}

export async function runFleetComplianceEscalationJobCtrl(input: {
  companyId: string;
  actorUserId: string;
  incidentEscalateAfterDays?: number;
  incidentCriticalEscalateAfterDays?: number;
  complianceEscalateAfterDays?: number;
  incidentLimit?: number;
  recipientLimit?: number;
}) {
  return runFleetComplianceEscalationJobSvc(input);
}

export async function runFleetMaintenanceAutomationJobCtrl(input: {
  companyId: string;
  actorUserId: string;
  dueWithinDays?: number;
  planLimit?: number;
  autoCreateWorkOrders?: boolean;
  autoCreateProcurementDemands?: boolean;
  lowStockLimit?: number;
  replenishMultiplier?: number;
}) {
  return runFleetMaintenanceAutomationJobSvc(input);
}

export async function runFleetAutomationOrchestrationJobCtrl(input: {
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
  return runFleetAutomationOrchestrationJobSvc(input);
}

export async function listFleetLowStockProcurementCandidatesCtrl(input: {
  companyId: string;
  branchId?: string | null;
  limit?: number;
  replenishMultiplier?: number;
}) {
  return listFleetLowStockProcurementCandidatesSvc(input);
}

export async function runFleetPolicyReackReminderJobCtrl(input: {
  companyId: string;
  actorUserId: string;
  remindAfterDays?: number;
  limit?: number;
}) {
  return runFleetPolicyReackReminderJobSvc(input);
}

export async function runFleetVehicleLifecycleAutomationJobCtrl(input: {
  companyId: string;
  actorUserId: string;
  limit?: number;
}) {
  return runFleetVehicleLifecycleAutomationJobSvc(input);
}

export async function startFleetTripCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  startOdometerKm?: number | null;
  note?: string | null;
}) {
  return startFleetTripSvc(input);
}

export async function closeFleetTripCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  endOdometerKm?: number | null;
  note?: string | null;
}) {
  return closeFleetTripSvc(input);
}

export async function approveFleetFuelLogCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  return approveFleetFuelLogSvc(input);
}

export async function rejectFleetFuelLogCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  return rejectFleetFuelLogSvc(input);
}
