import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export type FleetVehicle = {
  id: string;
  branchId: string | null;
  plateNumber: string;
  model: string;
  year: number | null;
  vin: string | null;
  ownershipType: number;
  lessorName: string | null;
  leaseStartAt: string | null;
  leaseEndAt: string | null;
  fuelType: number;
  expectedKmPerLiter: number | null;
  tankCapacityLiters: number | null;
  payloadCapacityKg: number | null;
  cargoCapacityCbm: number | null;
  lifecycleStatus: number;
  insuranceExpiryAt: string | null;
  roadworthyExpiryAt: string | null;
  assignedDriverUserId: string | null;
  assignedDriverName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FleetVehicleDocument = {
  id: string;
  vehicleId: string;
  documentType: string;
  documentNumber: string | null;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetVehicleOption = {
  id: string;
  plateNumber: string;
  model: string;
  isActive: boolean;
};

export type FleetVehicleComplianceAlert = {
  vehicleId: string;
  plateNumber: string;
  model: string;
  alertType: 'insurance_expiry' | 'roadworthy_expiry' | 'document_expiry';
  label: string;
  dueAt: string;
  source: 'vehicle' | 'document';
  sourceRef: string;
  daysUntilDue: number;
  severity: 'expired' | 'due_soon';
};

export type FleetVehicleComplianceAlertsResponse = {
  data: FleetVehicleComplianceAlert[];
  summary: {
    total: number;
    expired: number;
    dueSoon: number;
  };
};

export type FleetDriverOption = {
  id: string;
  employeeNumber: string;
  displayName: string;
  jobTitleName: string | null;
  employmentStatus: number | null;
};

export type FleetDriverComplianceRecord = {
  id: string;
  employeeId: string;
  complianceType: number;
  documentNumber: string | null;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetDriverComplianceAlert = {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  complianceType: number;
  label: string;
  dueAt: string;
  severity: 'expired' | 'due_soon';
  daysUntilDue: number;
};

export type FleetDriverComplianceAlertsResponse = {
  data: FleetDriverComplianceAlert[];
  summary: {
    total: number;
    expired: number;
    dueSoon: number;
  };
};

export type FleetComplianceDashboardStatus = 'expired' | 'due_7' | 'due_30' | 'due_60';

export type FleetComplianceDashboardAlert = {
  id: string;
  kind: 'vehicle' | 'driver';
  alertType:
    | 'insurance_expiry'
    | 'roadworthy_expiry'
    | 'document_expiry'
    | 'driver_compliance_expiry';
  sourceRef: string;
  branchId: string | null;
  branchName: string | null;
  dueAt: string;
  daysUntilDue: number;
  status: FleetComplianceDashboardStatus;
  severity: 'expired' | 'due_soon';
  label: string;
  vehicleId: string | null;
  plateNumber: string | null;
  model: string | null;
  employeeId: string | null;
  employeeNumber: string | null;
  employeeName: string | null;
};

export type FleetComplianceDashboardResponse = {
  summary: {
    total: number;
    expired: number;
    dueIn7Days: number;
    dueIn30Days: number;
    dueIn60Days: number;
    vehicleAlerts: number;
    driverAlerts: number;
    openIncidents: number;
    criticalOpenIncidents: number;
    openViolations: number;
    openAccidents: number;
    revokedPolicies: number;
  };
  data: FleetComplianceDashboardAlert[];
};

export type FleetComplianceJobResult = {
  dashboardSummary: FleetComplianceDashboardResponse['summary'];
  recipients: number;
  inAppCreated: number;
  emailSent: number;
  emailFailed: number;
};

export type FleetComplianceEscalationJobResult = {
  incidentEscalations: number;
  complianceEscalations: number;
  recipients: number;
  inAppCreated: number;
  emailSent: number;
  emailFailed: number;
};

export type FleetMaintenanceAutomationJobResult = {
  dueWithinDays: number;
  scannedPlans: number;
  autoWorkOrdersCreated: number;
  autoPlansRescheduled: number;
  workOrderIds: string[];
  lowStockCandidates: number;
  procurementDemandsCreated: number;
  procurementDemandIds: string[];
};

export type FleetAutomationOrchestrationJobResult = {
  lifecycle: {
    scanned: number;
    movedToMaintenance: number;
    movedToRetired: number;
    movedToActive: number;
    updatedVehicleIds: string[];
  };
  maintenance: FleetMaintenanceAutomationJobResult;
  escalation: FleetComplianceEscalationJobResult;
};

export type FleetOpsQueueResponse = {
  summary: {
    complianceExpired: number;
    complianceDueIn7Days: number;
    openIncidents: number;
    criticalOpenIncidents: number;
    openWorkOrders: number;
    inProgressWorkOrders: number;
    activeDowntime: number;
    lowStockCandidates: number;
    policyReackDue: number;
    needsImmediateAction: number;
  };
  queues: {
    complianceAlerts: FleetComplianceDashboardAlert[];
    incidents: FleetComplianceIncident[];
    workOrders: FleetMaintenanceWorkOrder[];
    downtime: FleetDowntimeEvent[];
    lowStockCandidates: Array<{
      partId: string;
      branchId: string | null;
      sku: string;
      name: string;
      unit: string;
      qtyOnHand: number;
      reorderLevel: number;
      averageUnitCostPsw: number;
      suggestedQty: number;
      suggestedAmountPsw: number;
    }>;
    policyReackTargets: Array<{
      id: string;
      userId: string | null;
      policyCode: string;
      policyVersion: string;
      acknowledgedAt: string;
      userName: string | null;
      userEmail: string | null;
    }>;
  };
};

export type FleetMaintenancePlan = {
  id: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  title: string;
  description: string | null;
  intervalUnit: number;
  intervalValue: number;
  lastServiceAt: string | null;
  lastServiceOdometerKm: number | null;
  nextDueAt: string | null;
  nextDueOdometerKm: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FleetMaintenanceWorkOrder = {
  id: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  planId: string | null;
  workOrderNo: string;
  title: string;
  description: string | null;
  openedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  startedOdometerKm: number | null;
  completedOdometerKm: number | null;
  estimatedCostPsw: number;
  actualCostPsw: number;
  status: number;
  createdAt: string;
  updatedAt: string;
};

export type FleetDowntimeEvent = {
  id: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  workOrderId: string | null;
  reason: string;
  note: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetDowntimeRcaWorkflow = {
  reasonCategory: string | null;
  lifecycleStatus: number;
  rootCause: string | null;
  correctiveAction: string | null;
  escalationLevel: number;
  reopenedCount: number;
  lastReopenedAt: string | null;
  updatedAt: string | null;
};

export type FleetDowntimeWorkflowEvent = FleetDowntimeEvent & {
  workflow: FleetDowntimeRcaWorkflow;
};

export type FleetReliabilityMetric = {
  vehicleId: string;
  vehiclePlateNumber: string | null;
  failureCount: number;
  mtbfHours: number | null;
  mttrMinutes: number | null;
  totalDowntimeMinutes: number;
};

export type FleetMaintenanceDashboard = {
  summary: {
    overduePlans: number;
    dueSoonPlans: number;
    openWorkOrders: number;
    activeDowntime: number;
  };
  overduePlans: FleetMaintenancePlan[];
  dueSoonPlans: FleetMaintenancePlan[];
  openWorkOrders: FleetMaintenanceWorkOrder[];
  activeDowntimeEvents: FleetDowntimeEvent[];
  reliability: FleetReliabilityMetric[];
};

export type FleetMaintenanceKpiDashboard = {
  summary: {
    windowDays: number;
    totalWorkOrders: number;
    openBacklog: number;
    duePlans: number;
    preventiveCompleted: number;
    preventiveCompliancePct: number;
    completedInWindow: number;
    slaBreachCount: number;
    slaBreachPct: number;
    meanTimeToScheduleHours: number | null;
    meanTimeToRepairHours: number | null;
    activeDowntime: number;
    averageDowntimeMinutes: number | null;
  };
  backlogAging: {
    d0to2: number;
    d3to7: number;
    d8to14: number;
    d15plus: number;
  };
  topReasons: Array<{ reason: string; count: number }>;
};

export type FleetMaintenanceReliabilityTrends = {
  summary: {
    windowDays: number;
    totalFailures: number;
    totalDowntimeMinutes: number;
  };
  monthly: Array<{
    month: string;
    failures: number;
    totalDowntimeMinutes: number;
    mtbfHours: number | null;
    mttrMinutes: number | null;
  }>;
  byVehicle: Array<{
    vehicleId: string;
    vehiclePlateNumber: string | null;
    failures: number;
    totalDowntimeMinutes: number;
    mtbfHours: number | null;
    mttrMinutes: number | null;
  }>;
  byBranch: Array<{
    branchId: string | null;
    failures: number;
    totalDowntimeMinutes: number;
    mtbfHours: number | null;
    mttrMinutes: number | null;
  }>;
  byVehicleClass: Array<{
    vehicleClass: string;
    failures: number;
    totalDowntimeMinutes: number;
    mtbfHours: number | null;
    mttrMinutes: number | null;
  }>;
  forecast: Array<{
    month: string;
    projectedFailures: number;
    projectedDowntimeMinutes: number;
    projectedMttrMinutes: number | null;
  }>;
};

export type FleetMaintenanceWorkOrderPartMovement = {
  id: string;
  workOrderId: string | null;
  partId: string;
  partSku: string;
  partName: string;
  partUnit: string;
  movementType: number;
  quantity: number;
  unitCostPsw: number;
  note: string | null;
  movedAt: string;
  movedBy: string | null;
  movedByName: string | null;
  createdAt: string;
};

export type FleetMaintenanceProcurementTraceabilityRow = {
  partId: string;
  branchId: string | null;
  sku: string;
  name: string;
  unit: string;
  qtyOnHand: number;
  reorderLevel: number;
  averageUnitCostPsw: number;
  latestDemandId: string | null;
  latestDemandNo: string | null;
  latestDemandStatus: number | null;
  latestDemandUpdatedAt: string | null;
  latestPoId: string | null;
  latestPoNo: string | null;
  orderedQty: number;
  receivedQty: number;
  lastReceiptAt: string | null;
  issuedQty: number;
  lastIssuedAt: string | null;
  approvalGatePassed: boolean;
  blockedReason: string | null;
  receiptGapQty: number;
};

export type FleetMaintenanceProcurementTraceabilityResponse = {
  summary: {
    totalParts: number;
    belowReorder: number;
    demandCreated: number;
    demandApproved: number;
    poRaised: number;
    fullyReceived: number;
  };
  data: FleetMaintenanceProcurementTraceabilityRow[];
};

export type FleetMaintenanceReorderDemandJobResult = {
  lowStockCandidates: number;
  procurementDemandsCreated: number;
  procurementDemandIds: string[];
};

export type FleetFuelLog = {
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
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetFuelAnalyticsRow = {
  tripId: string;
  tripNo: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  fuelType: number;
  benchmarkKmPerLiter: number;
  distanceKm: number;
  expectedLiters: number;
  actualLiters: number;
  varianceLiters: number;
  variancePct: number;
  fuelCostPsw: number;
  costPerKm: number | null;
  anomaly: boolean;
  approvedFuelLogCount: number;
  startedAt: string;
  endedAt: string;
};

export type FleetFuelAnalyticsResponse = {
  summary: {
    tripsAnalyzed: number;
    anomalyCount: number;
    totalExpectedLiters: number;
    totalActualLiters: number;
    totalVarianceLiters: number;
    totalFuelCostPsw: number;
    averageCostPerKm: number | null;
  };
  data: FleetFuelAnalyticsRow[];
};

export type FleetFuelFraudSignalsResponse = {
  summary: {
    tripsAnalyzed: number;
    flaggedTrips: number;
    highRiskTrips: number;
    mediumRiskTrips: number;
    lowRiskTrips: number;
  };
  data: Array<
    FleetFuelAnalyticsRow & {
      riskLevel: 'none' | 'low' | 'medium' | 'high';
      flags: {
        highVariance: boolean;
        highCostPerKm: boolean;
        rapidRefuelPattern: boolean;
      };
      ruleHits: number;
      effectiveHighCostPerKmThreshold: number;
    }
  >;
};

export type FleetComplianceKpiTrendsResponse = {
  summary: {
    windowDays: number;
    incidentsInWindow: number;
    openIncidents: number;
    criticalIncidents: number;
    policyAcksInWindow: number;
    pendingPolicyAcks: number;
    revokedPolicyAcks: number;
  };
  incidentAging: {
    d0to2: number;
    d3to7: number;
    d8to14: number;
    d15plus: number;
  };
  monthlyIncidents: Array<{
    month: string;
    total: number;
    open: number;
    critical: number;
    resolvedWithin48h: number;
    openRatePct: number;
    criticalRatePct: number;
    resolvedWithin48hPct: number;
  }>;
  monthlyPolicyAcks: Array<{
    month: string;
    total: number;
    acknowledged: number;
    pending: number;
    revoked: number;
    acknowledgmentRatePct: number;
    pendingRatePct: number;
    revokedRatePct: number;
  }>;
};

export type FleetUnitEconomicsResponse = {
  summary: {
    routeCount: number;
    branchCount: number;
    customerCount: number;
    trendMonths: number;
  };
  profitabilityByRoute: Array<{
    routePlanId: string | null;
    routePlanName: string | null;
    trips: number;
    totalDistanceKm: number;
    totalFuelCostPsw: number;
    totalParcelCount: number;
    costPerKm: number;
    costPerTrip: number;
    costPerParcel: number;
  }>;
  profitabilityByBranch: Array<{
    branchId: string | null;
    branchName: string | null;
    trips: number;
    totalDistanceKm: number;
    totalFuelCostPsw: number;
    totalParcelCount: number;
    costPerKm: number;
    costPerTrip: number;
    costPerParcel: number;
  }>;
  profitabilityByCustomer: Array<{
    senderId: string;
    senderName: string | null;
    trips: number;
    totalParcelCount: number;
    totalRevenuePsw: number;
    totalFuelCostPsw: number;
    marginPsw: number;
    revenuePerParcel: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    trips: number;
    totalFuelCostPsw: number;
    totalDistanceKm: number;
    totalParcelCount: number;
    totalRevenuePsw: number;
    costPerTrip: number;
    costPerParcel: number;
    revenuePerParcel: number;
  }>;
  benchmarkCuts: {
    topRouteCostPerKm: Array<{
      routePlanId: string | null;
      routePlanName: string | null;
      trips: number;
      totalDistanceKm: number;
      totalFuelCostPsw: number;
      totalParcelCount: number;
      costPerKm: number;
      costPerTrip: number;
      costPerParcel: number;
    }>;
    topBranchCostPerParcel: Array<{
      branchId: string | null;
      branchName: string | null;
      trips: number;
      totalDistanceKm: number;
      totalFuelCostPsw: number;
      totalParcelCount: number;
      costPerKm: number;
      costPerTrip: number;
      costPerParcel: number;
    }>;
    lowestMarginCustomers: Array<{
      senderId: string;
      senderName: string | null;
      trips: number;
      totalParcelCount: number;
      totalRevenuePsw: number;
      totalFuelCostPsw: number;
      marginPsw: number;
      revenuePerParcel: number;
    }>;
  };
};

export type FleetTrip = {
  id: string;
  tripNo: string;
  branchId: string | null;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  routePlanId: string | null;
  routePlanName: string | null;
  driverEmployeeId: string;
  driverEmployeeName: string | null;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  startOdometerKm: number | null;
  endOdometerKm: number | null;
  status: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetRoutePlanStop = {
  id: string;
  routePlanId: string;
  sequenceNo: number;
  label: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  plannedArrivalOffsetMin: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetRoutePlan = {
  id: string;
  branchId: string | null;
  name: string;
  code: string | null;
  originLabel: string | null;
  destinationLabel: string | null;
  distanceKm: number | null;
  estimatedDurationMin: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stops?: FleetRoutePlanStop[];
};

export type FleetTripCrew = {
  employeeId: string;
  employeeName: string;
  role: string;
  assignedAt: string;
};

export type FleetTripEvent = {
  id: string;
  tripId: string;
  eventType: number;
  occurredAt: string;
  odometerKm: number | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  createdByName: string | null;
};

export type FleetTripLoadMatch = {
  id: string;
  tripId: string;
  parcelId: string;
  status: number;
  matchedBy: string | null;
  matchedAt: string;
  loadedAt: string | null;
  unloadedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  trackingCode: string | null;
  bookingCode: string | null;
  sourceId: string | null;
  destinationId: string | null;
};

export type FleetTripLoadAuditEntry = {
  id: string;
  actorUserId: string | null;
  actorUserName: string | null;
  action: string;
  message: string | null;
  metadata: unknown;
  createdAt: string;
};

export type FleetDispatchRouteAssignmentQueueRow = FleetTrip & {
  scheduleComplete: boolean;
  routeAssigned: boolean;
  vehicleConflict: boolean;
  driverConflict: boolean;
  hasConflict: boolean;
};

export type FleetDispatchRouteAssignmentQueueResponse = {
  summary: {
    total: number;
    missingRoute: number;
    missingSchedule: number;
    conflicts: number;
  };
  data: FleetDispatchRouteAssignmentQueueRow[];
};

export type FleetDispatchLoadCandidate = {
  parcelId: string;
  sourceId: string | null;
  destinationId: string | null;
  parcelStatus: number;
  bookingCode: string;
  trackingCode: string;
  activeTripId: string | null;
  activeLoadStatus: number | null;
  assignedToAnotherTrip: boolean;
  routeAligned: boolean | null;
  assignmentBlockedReason: string | null;
};

export type FleetDispatchLoadCandidatesResponse = {
  summary: {
    total: number;
    available: number;
    assignedElsewhere: number;
    routeAligned: number;
    routeContext: {
      routePlanId: string;
      routePlanName: string;
    } | null;
  };
  data: FleetDispatchLoadCandidate[];
};

export type FleetDispatchOpsPerformanceResponse = {
  summary: {
    windowDays: number;
    routeAssignmentCoveragePct: number;
    onTimeCompletionPct: number;
    checkOutCoveragePct: number;
    delayedUpdates: number;
    stoppedUpdates: number;
  };
  tripStats: {
    plannedTrips: number;
    inProgressTrips: number;
    completedTrips: number;
    onTimeCompletedTrips: number;
    plannedTripsWithRoute: number;
  };
  checkEventStats: {
    checkInEvents: number;
    checkOutEvents: number;
    tripsWithCheckIn: number;
    tripsWithCheckOut: number;
  };
  statusUpdateStats: {
    delayedUpdates: number;
    stoppedUpdates: number;
  };
  loadStats: {
    assignedLoads: number;
    loadedLoads: number;
    unloadedLoads: number;
    cancelledLoads: number;
  };
};

export type FleetTripTelemetryPoint = {
  id: string;
  tripId: string;
  sampledAt: string;
  latitude: number;
  longitude: number;
  speedKph: number | null;
  headingDeg: number | null;
  altitudeM: number | null;
  accuracyM: number | null;
  source: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type FleetTripStatusUpdate = {
  id: string;
  tripId: string;
  statusType: number;
  occurredAt: string;
  locationLabel: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  createdByName: string | null;
};

export type FleetShiftRoster = {
  id: string;
  branchId: string | null;
  employeeId: string;
  employeeName: string;
  vehicleId: string | null;
  vehiclePlateNumber: string | null;
  roleType: number;
  status: number;
  shiftStartAt: string;
  shiftEndAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetComplianceIncident = {
  id: string;
  tripId: string | null;
  vehicleId: string | null;
  employeeId: string | null;
  incidentType: number;
  severity: number;
  occurredAt: string;
  locationLabel: string | null;
  description: string;
  actionTaken: string | null;
  resolvedAt: string | null;
  caseStatus: 'open' | 'resolved';
  reportedBy: string | null;
  reporterName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetPolicyAcknowledgment = {
  id: string;
  employeeId: string | null;
  userId: string | null;
  policyCode: string;
  policyVersion: string;
  status: number;
  acknowledgedAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  employeeName: string | null;
};

export type FleetMaintenancePart = {
  id: string;
  branchId: string | null;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  qtyOnHand: number;
  reorderLevel: number;
  averageUnitCostPsw: number;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FleetMaintenancePartMovement = {
  id: string;
  partId: string;
  workOrderId: string | null;
  movementType: number;
  quantity: number;
  unitCostPsw: number;
  note: string | null;
  movedAt: string;
  movedBy: string | null;
  movedByName: string | null;
  createdAt: string;
};

export const fleetTransportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listFleetVehicles: builder.query<
      ServerListResponse<FleetVehicle>,
      ServerListQuery<{ isActive?: boolean }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/vehicles',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    listFleetVehicleOptions: builder.query<
      FleetVehicleOption[],
      { search?: string; isActive?: boolean } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/vehicles/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'VEHICLE_OPTIONS' }],
    }),

    listFleetVehicleComplianceAlerts: builder.query<
      FleetVehicleComplianceAlertsResponse,
      { horizonDays?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/vehicles/compliance-alerts',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'COMPLIANCE_ALERTS' }],
    }),

    listFleetDriverOptions: builder.query<FleetDriverOption[], { search?: string } | void>({
      query: (params) => ({
        url: '/fleet-transport/drivers/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DRIVER_OPTIONS' }],
    }),

    listFleetDriverComplianceRecords: builder.query<
      FleetDriverComplianceRecord[],
      { employeeId: string }
    >({
      query: ({ employeeId }) => ({
        url: `/fleet-transport/drivers/${employeeId}/compliance-records`,
      }),
      providesTags: (_result, _error, { employeeId }) => [
        { type: 'FleetTransport', id: `DRIVER_COMPLIANCE_${employeeId}` },
      ],
    }),

    createFleetDriverComplianceRecord: builder.mutation<
      { id: string },
      {
        employeeId: string;
        complianceType: number;
        documentNumber?: string | null;
        issuer?: string | null;
        issuedAt?: string | null;
        expiresAt?: string | null;
        fileUrl?: string | null;
        note?: string | null;
      }
    >({
      query: ({ employeeId, ...body }) => ({
        url: `/fleet-transport/drivers/${employeeId}/compliance-records`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [
        { type: 'FleetTransport', id: 'DRIVER_COMPLIANCE_ALERTS' },
        { type: 'FleetTransport', id: `DRIVER_COMPLIANCE_${employeeId}` },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetDriverComplianceAlerts: builder.query<
      FleetDriverComplianceAlertsResponse,
      { horizonDays?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/drivers/compliance-alerts',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DRIVER_COMPLIANCE_ALERTS' }],
    }),

    getFleetComplianceDashboard: builder.query<
      FleetComplianceDashboardResponse,
      {
        horizonDays?: number;
        limit?: number;
        branchId?: string;
        status?: 'all' | FleetComplianceDashboardStatus;
      } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/compliance-dashboard',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'COMPLIANCE_DASHBOARD' }],
    }),

    getFleetComplianceKpiTrends: builder.query<
      FleetComplianceKpiTrendsResponse,
      { windowDays?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/compliance/kpis/trends',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'COMPLIANCE_DASHBOARD' }],
    }),

    runFleetComplianceAlertJob: builder.mutation<
      FleetComplianceJobResult,
      { horizonDays?: number; recipientLimit?: number; maxAlertsInDigest?: number } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/compliance-dashboard/alerts/run-daily',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'COMPLIANCE_DASHBOARD' },
        { type: 'FleetTransport', id: 'COMPLIANCE_ALERTS' },
        { type: 'FleetTransport', id: 'DRIVER_COMPLIANCE_ALERTS' },
      ],
    }),

    runFleetComplianceEscalationJob: builder.mutation<
      FleetComplianceEscalationJobResult,
      {
        incidentEscalateAfterDays?: number;
        incidentCriticalEscalateAfterDays?: number;
        complianceEscalateAfterDays?: number;
        incidentLimit?: number;
        recipientLimit?: number;
      } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/compliance/escalations/run-daily',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: [{ type: 'FleetTransport', id: 'COMPLIANCE_DASHBOARD' }],
    }),

    getFleetOpsQueue: builder.query<
      FleetOpsQueueResponse,
      {
        horizonDays?: number;
        incidentLimit?: number;
        workOrderLimit?: number;
        downtimeLimit?: number;
        lowStockLimit?: number;
        policyReackAfterDays?: number;
      } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/ops-queue',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'OPS_QUEUE' }],
    }),

    getFleetMaintenanceDashboard: builder.query<
      FleetMaintenanceDashboard,
      { horizonDays?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/dashboard',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' }],
    }),

    listFleetMaintenancePlans: builder.query<
      FleetMaintenancePlan[],
      { vehicleId?: string; isActive?: boolean } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/plans',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_PLANS' }],
    }),

    createFleetMaintenancePlan: builder.mutation<
      { id: string },
      {
        vehicleId: string;
        title: string;
        description?: string | null;
        intervalUnit: number;
        intervalValue: number;
        lastServiceAt?: string | null;
        lastServiceOdometerKm?: number | null;
        nextDueAt?: string | null;
        nextDueOdometerKm?: number | null;
        isActive?: boolean;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/maintenance/plans',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_PLANS' },
        { type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    updateFleetMaintenancePlan: builder.mutation<
      { id: string },
      {
        id: string;
        body: Partial<
          Omit<
            FleetMaintenancePlan,
            'id' | 'vehicleId' | 'vehiclePlateNumber' | 'createdAt' | 'updatedAt'
          >
        >;
      }
    >({
      query: ({ id, body }) => ({
        url: `/fleet-transport/maintenance/plans/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_PLANS' },
        { type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetMaintenanceWorkOrders: builder.query<
      FleetMaintenanceWorkOrder[],
      { vehicleId?: string; status?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/work-orders',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_WORK_ORDERS' }],
    }),

    createFleetMaintenanceWorkOrder: builder.mutation<
      { id: string },
      {
        vehicleId: string;
        planId?: string | null;
        title: string;
        description?: string | null;
        estimatedCostPsw?: number;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/maintenance/work-orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_WORK_ORDERS' },
        { type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    updateFleetMaintenanceWorkOrder: builder.mutation<
      { id: string },
      {
        id: string;
        body: {
          title?: string;
          description?: string | null;
          status?: number;
          startedOdometerKm?: number | null;
          completedOdometerKm?: number | null;
          actualCostPsw?: number;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/fleet-transport/maintenance/work-orders/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_WORK_ORDERS' },
        { type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetDowntimeEvents: builder.query<
      FleetDowntimeEvent[],
      { vehicleId?: string; openOnly?: boolean } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/downtime',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_DOWNTIME' }],
    }),

    createFleetDowntimeEvent: builder.mutation<
      { id: string },
      {
        vehicleId: string;
        workOrderId?: string | null;
        reason: string;
        note?: string | null;
        startedAt?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/maintenance/downtime',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_DOWNTIME' },
        { type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    closeFleetDowntimeEvent: builder.mutation<
      { id: string },
      { id: string; endedAt?: string | null; note?: string | null }
    >({
      query: ({ id, endedAt, note }) => ({
        url: `/fleet-transport/maintenance/downtime/${id}/close`,
        method: 'POST',
        body: { endedAt: endedAt ?? null, note: note ?? null },
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_DOWNTIME' },
        { type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    reopenFleetDowntimeEvent: builder.mutation<
      { id: string; workflow: FleetDowntimeRcaWorkflow },
      { id: string; reason?: string | null }
    >({
      query: ({ id, reason }) => ({
        url: `/fleet-transport/maintenance/downtime/${id}/reopen`,
        method: 'POST',
        body: { reason: reason ?? null },
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_DOWNTIME' },
        { type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetDowntimeRcaWorkflows: builder.query<
      FleetDowntimeWorkflowEvent[],
      { vehicleId?: string; openOnly?: boolean; lifecycleStatus?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/downtime/workflows',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_DOWNTIME' }],
    }),

    updateFleetDowntimeRcaWorkflow: builder.mutation<
      { id: string; workflow: FleetDowntimeRcaWorkflow },
      {
        id: string;
        body: {
          reasonCategory?: string | null;
          lifecycleStatus?: number | null;
          rootCause?: string | null;
          correctiveAction?: string | null;
          escalationLevel?: number | null;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/fleet-transport/maintenance/downtime/${id}/workflow`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_DOWNTIME' },
        { type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetReliabilityMetrics: builder.query<
      FleetReliabilityMetric[],
      { vehicleId?: string } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/reliability',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_RELIABILITY' }],
    }),

    getFleetMaintenanceReliabilityTrends: builder.query<
      FleetMaintenanceReliabilityTrends,
      { windowDays?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/reliability/trends',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_RELIABILITY' }],
    }),

    getFleetMaintenanceKpiDashboard: builder.query<
      FleetMaintenanceKpiDashboard,
      { windowDays?: number; slaHours?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/kpis',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_DASHBOARD' }],
    }),

    listFleetMaintenanceWorkOrderPartMovements: builder.query<
      FleetMaintenanceWorkOrderPartMovement[],
      { id: string; limit?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/fleet-transport/maintenance/work-orders/${id}/part-movements`,
        params: params ?? undefined,
      }),
      providesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id: `MAINTENANCE_WORK_ORDER_${id}` },
      ],
    }),

    getFleetMaintenanceProcurementTraceability: builder.query<
      FleetMaintenanceProcurementTraceabilityResponse,
      { branchId?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/procurement/traceability',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'MAINTENANCE_PROCUREMENT_TRACEABILITY' }],
    }),

    runFleetMaintenanceReorderDemandJob: builder.mutation<
      FleetMaintenanceReorderDemandJobResult,
      { dueWithinDays?: number; lowStockLimit?: number; replenishMultiplier?: number } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/maintenance/procurement/reorder/run',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'MAINTENANCE_PROCUREMENT_TRACEABILITY' },
        { type: 'FleetTransport', id: 'OPS_QUEUE' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    createFleetVehicle: builder.mutation<
      { id: string },
      {
        branchId?: string | null;
        plateNumber: string;
        model: string;
        year?: number | null;
        vin?: string | null;
        ownershipType?: number;
        lessorName?: string | null;
        leaseStartAt?: string | null;
        leaseEndAt?: string | null;
        fuelType?: number;
        expectedKmPerLiter?: number | null;
        tankCapacityLiters?: number | null;
        payloadCapacityKg?: number | null;
        cargoCapacityCbm?: number | null;
        lifecycleStatus?: number;
        insuranceExpiryAt?: string | null;
        roadworthyExpiryAt?: string | null;
        assignedDriverUserId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/vehicles',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'COMPLIANCE_ALERTS' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    updateFleetVehicle: builder.mutation<
      { id: string },
      {
        id: string;
        body: {
          branchId?: string | null;
          plateNumber?: string;
          model?: string;
          year?: number | null;
          vin?: string | null;
          ownershipType?: number;
          lessorName?: string | null;
          leaseStartAt?: string | null;
          leaseEndAt?: string | null;
          fuelType?: number;
          expectedKmPerLiter?: number | null;
          tankCapacityLiters?: number | null;
          payloadCapacityKg?: number | null;
          cargoCapacityCbm?: number | null;
          lifecycleStatus?: number;
          insuranceExpiryAt?: string | null;
          roadworthyExpiryAt?: string | null;
          assignedDriverUserId?: string | null;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/fleet-transport/vehicles/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        { type: 'FleetTransport', id: 'COMPLIANCE_ALERTS' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    getFleetVehicle: builder.query<FleetVehicle, string>({
      query: (id) => ({
        url: `/fleet-transport/vehicles/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'FleetTransport', id }],
    }),

    listFleetVehicleDocuments: builder.query<FleetVehicleDocument[], { vehicleId: string }>({
      query: ({ vehicleId }) => ({
        url: `/fleet-transport/vehicles/${vehicleId}/documents`,
      }),
      providesTags: (_result, _error, { vehicleId }) => [{ type: 'FleetTransport', id: vehicleId }],
    }),

    createFleetVehicleDocument: builder.mutation<
      { id: string },
      {
        vehicleId: string;
        documentType: string;
        documentNumber?: string | null;
        issuer?: string | null;
        issuedAt?: string | null;
        expiresAt?: string | null;
        fileUrl?: string | null;
        note?: string | null;
      }
    >({
      query: ({ vehicleId, ...body }) => ({
        url: `/fleet-transport/vehicles/${vehicleId}/documents`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { vehicleId }) => [
        { type: 'FleetTransport', id: vehicleId },
        { type: 'FleetTransport', id: 'COMPLIANCE_ALERTS' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetTrips: builder.query<
      ServerListResponse<FleetTrip>,
      ServerListQuery<{ status?: number; vehicleId?: string; driverEmployeeId?: string }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/trips',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    getFleetTrip: builder.query<FleetTrip, string>({
      query: (id) => ({
        url: `/fleet-transport/trips/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'FleetTransport', id }],
    }),

    listFleetRoutePlans: builder.query<
      FleetRoutePlan[],
      { isActive?: boolean; branchId?: string } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/routes/plans',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'ROUTE_PLANS' }],
    }),

    getFleetRoutePlan: builder.query<FleetRoutePlan, string>({
      query: (id) => ({
        url: `/fleet-transport/routes/plans/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'FleetTransport', id: `ROUTE_PLAN_${id}` }],
    }),

    createFleetRoutePlan: builder.mutation<
      { id: string },
      {
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
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/routes/plans',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'ROUTE_PLANS' },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    createFleetTrip: builder.mutation<
      { id: string },
      {
        branchId?: string | null;
        vehicleId: string;
        routePlanId?: string | null;
        driverEmployeeId: string;
        crewEmployeeIds?: string[];
        plannedStartAt?: string | null;
        plannedEndAt?: string | null;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/trips',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    assignFleetTripRoute: builder.mutation<
      { id: string },
      {
        id: string;
        routePlanId?: string | null;
      }
    >({
      query: ({ id, routePlanId }) => ({
        url: `/fleet-transport/trips/${id}/route-assignment`,
        method: 'PUT',
        body: { routePlanId: routePlanId ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    assignFleetTripCrew: builder.mutation<
      { id: string },
      {
        id: string;
        crewEmployeeIds: string[];
      }
    >({
      query: ({ id, crewEmployeeIds }) => ({
        url: `/fleet-transport/trips/${id}/crew`,
        method: 'PUT',
        body: { crewEmployeeIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetTripCrew: builder.query<FleetTripCrew[], { id: string }>({
      query: ({ id }) => ({
        url: `/fleet-transport/trips/${id}/crew`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    listFleetTripEvents: builder.query<FleetTripEvent[], { id: string }>({
      query: ({ id }) => ({
        url: `/fleet-transport/trips/${id}/events`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    listFleetTripLoadMatches: builder.query<FleetTripLoadMatch[], { id: string }>({
      query: ({ id }) => ({
        url: `/fleet-transport/trips/${id}/loads`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    listFleetTripLoadAuditTrail: builder.query<
      FleetTripLoadAuditEntry[],
      { id: string; limit?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/fleet-transport/trips/${id}/loads/audit`,
        params: params ?? undefined,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    assignFleetTripLoadMatch: builder.mutation<
      { id: string },
      { id: string; parcelId: string; note?: string | null }
    >({
      query: ({ id, parcelId, note }) => ({
        url: `/fleet-transport/trips/${id}/loads`,
        method: 'POST',
        body: { parcelId, note: note ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    updateFleetTripLoadMatchStatus: builder.mutation<
      { id: string },
      { loadMatchId: string; status: number; note?: string | null }
    >({
      query: ({ loadMatchId, status, note }) => ({
        url: `/fleet-transport/trips/load-matches/${loadMatchId}/status`,
        method: 'PATCH',
        body: { status, note: note ?? null },
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    listFleetTripTelemetryPoints: builder.query<
      FleetTripTelemetryPoint[],
      { id: string; limit?: number } | { id: string }
    >({
      query: ({ id, ...params }) => ({
        url: `/fleet-transport/trips/${id}/telemetry`,
        params,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    recordFleetTripTelemetryPoint: builder.mutation<
      { id: string },
      {
        id: string;
        sampledAt?: string | null;
        latitude: number;
        longitude: number;
        speedKph?: number | null;
        headingDeg?: number | null;
        altitudeM?: number | null;
        accuracyM?: number | null;
        source?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fleet-transport/trips/${id}/telemetry`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    listFleetTripStatusUpdates: builder.query<FleetTripStatusUpdate[], { id: string }>({
      query: ({ id }) => ({
        url: `/fleet-transport/trips/${id}/status-updates`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    recordFleetTripStatusUpdate: builder.mutation<
      { id: string },
      {
        id: string;
        statusType: number;
        occurredAt?: string | null;
        locationLabel?: string | null;
        note?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fleet-transport/trips/${id}/status-updates`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    getFleetTripTimeline: builder.query<
      Array<{ kind: string; occurredAt: string; payload: unknown }>,
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/fleet-transport/trips/${id}/timeline`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    listFleetShiftRosters: builder.query<
      ServerListResponse<FleetShiftRoster>,
      ServerListQuery<{
        branchId?: string;
        employeeId?: string;
        vehicleId?: string;
        status?: number;
      }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/rosters',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    getFleetShiftRoster: builder.query<FleetShiftRoster, { id: string }>({
      query: ({ id }) => ({
        url: `/fleet-transport/rosters/${id}`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'FleetTransport', id }],
    }),

    createFleetShiftRoster: builder.mutation<
      { id: string },
      {
        branchId?: string | null;
        employeeId: string;
        vehicleId?: string | null;
        roleType: number;
        shiftStartAt: string;
        shiftEndAt: string;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/rosters',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    updateFleetShiftRoster: builder.mutation<
      { id: string },
      {
        id: string;
        vehicleId?: string | null;
        status?: number | null;
        shiftStartAt?: string | null;
        shiftEndAt?: string | null;
        note?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fleet-transport/rosters/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    transitionFleetVehicleLifecycle: builder.mutation<
      { id: string; lifecycleStatus: number },
      { id: string; lifecycleStatus: number; note?: string | null }
    >({
      query: ({ id, lifecycleStatus, note }) => ({
        url: `/fleet-transport/vehicles/${id}/lifecycle`,
        method: 'PATCH',
        body: { lifecycleStatus, note: note ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetComplianceIncidents: builder.query<
      ServerListResponse<FleetComplianceIncident>,
      ServerListQuery<{
        incidentType?: number;
        severity?: number;
        caseStatus?: 'open' | 'resolved';
        employeeId?: string;
        vehicleId?: string;
      }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/compliance/incidents',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    transitionFleetComplianceIncidentCase: builder.mutation<
      { id: string; resolvedAt: string | null; caseStatus: 'open' | 'resolved' },
      {
        id: string;
        action: 'resolve' | 'reopen';
        actionTaken?: string | null;
        resolvedAt?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fleet-transport/compliance/incidents/${id}/transition`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    createFleetComplianceIncident: builder.mutation<
      { id: string },
      {
        tripId?: string | null;
        vehicleId?: string | null;
        employeeId?: string | null;
        incidentType: number;
        severity: number;
        occurredAt: string;
        locationLabel?: string | null;
        description: string;
        actionTaken?: string | null;
        resolvedAt?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/compliance/incidents',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    updateFleetComplianceIncident: builder.mutation<
      { id: string },
      {
        id: string;
        severity?: number | null;
        actionTaken?: string | null;
        resolvedAt?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fleet-transport/compliance/incidents/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetPolicyAcknowledgments: builder.query<
      ServerListResponse<FleetPolicyAcknowledgment>,
      ServerListQuery<{ policyCode?: string; employeeId?: string; userId?: string }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/compliance/policy-acknowledgments',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    acknowledgeFleetPolicy: builder.mutation<
      { id: string },
      {
        employeeId?: string | null;
        userId?: string | null;
        policyCode: string;
        policyVersion: string;
        status?: number;
        acknowledgedAt?: string | null;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/compliance/policy-acknowledgments',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    listFleetMaintenanceParts: builder.query<
      ServerListResponse<FleetMaintenancePart>,
      ServerListQuery<{ branchId?: string; isActive?: boolean; search?: string }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/maintenance/parts',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    createFleetMaintenancePart: builder.mutation<
      { id: string },
      {
        branchId?: string | null;
        sku: string;
        name: string;
        category?: string | null;
        unit?: string | null;
        qtyOnHand?: number;
        reorderLevel?: number;
        averageUnitCostPsw?: number;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/maintenance/parts',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    adjustFleetMaintenancePartStock: builder.mutation<
      { id: string; qtyOnHand: number },
      {
        partId: string;
        movementType: number;
        quantity: number;
        unitCostPsw?: number;
        workOrderId?: string | null;
        note?: string | null;
      }
    >({
      query: ({ partId, ...body }) => ({
        url: `/fleet-transport/maintenance/parts/${partId}/stock-movements`,
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    listFleetMaintenancePartMovements: builder.query<
      ServerListResponse<FleetMaintenancePartMovement>,
      { partId: string; page?: number; pageSize?: number; search?: string }
    >({
      query: ({ partId, ...query }) => ({
        url: `/fleet-transport/maintenance/parts/${partId}/stock-movements`,
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    runFleetLowStockAlertJob: builder.mutation<
      {
        lowStockParts: number;
        recipients: number;
        inAppCreated: number;
        emailSent: number;
        emailFailed: number;
      },
      { recipientLimit?: number; partLimit?: number; branchId?: string | null } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/maintenance/parts/alerts/run-daily',
        method: 'POST',
        body: body ?? {},
      }),
    }),

    runFleetMaintenanceAutomationJob: builder.mutation<
      FleetMaintenanceAutomationJobResult,
      {
        dueWithinDays?: number;
        planLimit?: number;
        autoCreateWorkOrders?: boolean;
        autoCreateProcurementDemands?: boolean;
        lowStockLimit?: number;
        replenishMultiplier?: number;
      } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/maintenance/automation/run-daily',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    getFleetDispatchBoard: builder.query<
      {
        tripCounts: { planned: number; inProgress: number; completed: number };
        loadCounts: { assigned: number; loaded: number };
        openIncidents: number;
      },
      void
    >({
      query: () => ({ url: '/fleet-transport/dispatch/board' }),
      providesTags: [{ type: 'FleetTransport', id: 'DISPATCH_BOARD' }],
    }),

    getFleetDispatchOpsPerformance: builder.query<
      FleetDispatchOpsPerformanceResponse,
      { windowDays?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/dispatch/ops-performance',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DISPATCH_BOARD' }],
    }),

    getFleetDispatchExceptionQueue: builder.query<
      {
        summary: {
          total: number;
          missingSchedule: number;
          routeUnassigned: number;
          resourceConflict: number;
          delayedInProgress: number;
        };
        data: Array<{
          tripId: string;
          tripNo: string;
          branchId: string | null;
          branchName: string | null;
          vehicleId: string;
          vehiclePlateNumber: string;
          driverEmployeeId: string;
          driverEmployeeName: string | null;
          status: number;
          category:
            | 'missing_schedule'
            | 'route_unassigned'
            | 'resource_conflict'
            | 'delayed_in_progress';
          reason: string;
          plannedStartAt: string | null;
          plannedEndAt: string | null;
          startedAt: string | null;
          endedAt: string | null;
        }>;
      },
      { branchId?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/dispatch/exception-queue',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DISPATCH_BOARD' }],
    }),

    getFleetDispatchRouteAssignmentQueue: builder.query<
      FleetDispatchRouteAssignmentQueueResponse,
      { branchId?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/dispatch/route-assignment-queue',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DISPATCH_BOARD' }],
    }),

    getFleetDispatchLoadCandidates: builder.query<
      FleetDispatchLoadCandidatesResponse,
      { tripId: string; search?: string; limit?: number }
    >({
      query: (params) => ({
        url: '/fleet-transport/dispatch/load-candidates',
        params,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DISPATCH_BOARD' }],
    }),

    getFleetDecisionSupportOverview: builder.query<
      {
        utilization: { plannedTrips: number; inProgressTrips: number; completedTrips: number };
        onTimePerformance: { completedTrips: number; onTimeTrips: number; onTimePct: number };
        profitabilityByRoute: Array<{
          routePlanId: string | null;
          routePlanName: string | null;
          trips: number;
          totalDistanceKm: number;
          totalFuelCostPsw: number;
          totalParcelCount: number;
          costPerKm: number;
          costPerTrip: number;
          costPerParcel: number;
        }>;
        profitabilityByBranch: Array<{
          branchId: string | null;
          branchName: string | null;
          trips: number;
          totalDistanceKm: number;
          totalFuelCostPsw: number;
          totalParcelCount: number;
          costPerKm: number;
          costPerTrip: number;
          costPerParcel: number;
        }>;
        profitabilityByCustomer: Array<{
          senderId: string;
          senderName: string | null;
          trips: number;
          totalParcelCount: number;
          totalRevenuePsw: number;
          totalFuelCostPsw: number;
          marginPsw: number;
          revenuePerParcel: number;
        }>;
        monthlyTrends: Array<{
          month: string;
          trips: number;
          totalFuelCostPsw: number;
          totalDistanceKm: number;
          totalParcelCount: number;
          totalRevenuePsw: number;
          costPerTrip: number;
          costPerParcel: number;
          revenuePerParcel: number;
        }>;
        driverScorecards: Array<{
          driverEmployeeId: string;
          driverEmployeeName: string | null;
          trips: number;
          anomalyCount: number;
          averageVariancePct: number;
          onTimePct: number;
        }>;
      },
      {
        dateFrom?: string;
        dateTo?: string;
        expectedOveruseThresholdPct?: number;
        defaultExpectedKmPerLiter?: number;
      } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/decision-support/overview',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DECISION_SUPPORT' }],
    }),

    getFleetExecutiveScorecard: builder.query<
      {
        summary: {
          overallStatus: 'healthy' | 'watch' | 'critical';
          metTargets: number;
          totalTargets: number;
        };
        targets: {
          onTimeTargetPct: number;
          routeCoverageTargetPct: number;
          checkOutCoverageTargetPct: number;
          mttrTargetHours: number;
        };
        kpis: Array<{
          key: string;
          label: string;
          actual: number | null;
          target: number;
          meetsTarget: boolean;
          direction: 'higher_is_better' | 'lower_is_better';
        }>;
        topDriverRisks: Array<{
          driverEmployeeId: string;
          driverEmployeeName: string | null;
          trips: number;
          anomalyCount: number;
          averageVariancePct: number;
          onTimePct: number;
        }>;
        topRouteCostRisks: Array<{
          routePlanId: string | null;
          routePlanName: string | null;
          trips: number;
          totalDistanceKm: number;
          totalFuelCostPsw: number;
          totalParcelCount: number;
          costPerKm: number;
          costPerTrip: number;
          costPerParcel: number;
        }>;
      },
      {
        dateFrom?: string;
        dateTo?: string;
        expectedOveruseThresholdPct?: number;
        defaultExpectedKmPerLiter?: number;
        onTimeTargetPct?: number;
        routeCoverageTargetPct?: number;
        checkOutCoverageTargetPct?: number;
        mttrTargetHours?: number;
      } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/decision-support/executive-scorecard',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DECISION_SUPPORT' }],
    }),

    getFleetComplianceEscalationPolicy: builder.query<
      {
        incidentEscalateAfterDays: number;
        incidentCriticalEscalateAfterDays: number;
        complianceEscalateAfterDays: number;
        policyReackAfterDays: number;
        incidentLimit: number;
        recipientLimit: number;
      },
      void
    >({
      query: () => ({ url: '/fleet-transport/compliance/escalation-policy' }),
      providesTags: [{ type: 'FleetTransport', id: 'COMPLIANCE_POLICY' }],
    }),

    updateFleetComplianceEscalationPolicy: builder.mutation<
      {
        incidentEscalateAfterDays: number;
        incidentCriticalEscalateAfterDays: number;
        complianceEscalateAfterDays: number;
        policyReackAfterDays: number;
        incidentLimit: number;
        recipientLimit: number;
      },
      {
        incidentEscalateAfterDays?: number;
        incidentCriticalEscalateAfterDays?: number;
        complianceEscalateAfterDays?: number;
        policyReackAfterDays?: number;
        incidentLimit?: number;
        recipientLimit?: number;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/compliance/escalation-policy',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'FleetTransport', id: 'COMPLIANCE_POLICY' }],
    }),

    getFleetUnitEconomics: builder.query<
      FleetUnitEconomicsResponse,
      {
        dateFrom?: string;
        dateTo?: string;
        expectedOveruseThresholdPct?: number;
        defaultExpectedKmPerLiter?: number;
      } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/decision-support/unit-economics',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'DECISION_SUPPORT' }],
    }),

    listFleetLowStockProcurementCandidates: builder.query<
      {
        summary: {
          totalCandidates: number;
          totalSuggestedAmountPsw: number;
        };
        data: Array<{
          partId: string;
          branchId: string | null;
          sku: string;
          name: string;
          unit: string;
          qtyOnHand: number;
          reorderLevel: number;
          averageUnitCostPsw: number;
          suggestedQty: number;
          suggestedAmountPsw: number;
        }>;
      },
      { branchId?: string; limit?: number; replenishMultiplier?: number } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/maintenance/parts/procurement/candidates',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'LOW_STOCK_PROC_CANDIDATES' }],
    }),

    runFleetPolicyReackReminderJob: builder.mutation<
      {
        candidates: number;
        recipients: number;
        inAppCreated: number;
        emailSent: number;
        emailFailed: number;
      },
      { remindAfterDays?: number; limit?: number } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/compliance/policy-acknowledgments/run-daily-reminders',
        method: 'POST',
        body: body ?? {},
      }),
    }),

    runFleetVehicleLifecycleAutomationJob: builder.mutation<
      {
        scanned: number;
        movedToMaintenance: number;
        movedToRetired: number;
        movedToActive: number;
        updatedVehicleIds: string[];
      },
      { limit?: number } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/vehicles/lifecycle/run-daily-automation',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    runFleetAutomationOrchestrationJob: builder.mutation<
      FleetAutomationOrchestrationJobResult,
      {
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
      } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/automation/run-daily',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    runFleetAnalyticsSnapshotJob: builder.mutation<
      {
        generatedAt: string;
        windowDays: number;
        horizonDays: number;
        compliance: {
          windowDays: number;
          incidentsInWindow: number;
          openIncidents: number;
          criticalIncidents: number;
          policyAcksInWindow: number;
          pendingPolicyAcks: number;
          revokedPolicyAcks: number;
        };
        fraud: {
          tripsAnalyzed: number;
          flaggedTrips: number;
          highRiskTrips: number;
          mediumRiskTrips: number;
          lowRiskTrips: number;
        };
        economics: {
          routeCount: number;
          branchCount: number;
          customerCount: number;
          trendMonths: number;
        };
        reliability: {
          windowDays: number;
          totalFailures: number;
          totalDowntimeMinutes: number;
        };
      },
      {
        windowDays?: number;
        horizonDays?: number;
        defaultExpectedKmPerLiter?: number;
        expectedOveruseThresholdPct?: number;
      } | void
    >({
      query: (body) => ({
        url: '/fleet-transport/analytics/snapshots/run-daily',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: [
        { type: 'FleetTransport', id: 'FUEL_ANALYTICS' },
        { type: 'FleetTransport', id: 'COMPLIANCE_DASHBOARD' },
        { type: 'FleetTransport', id: 'DECISION_SUPPORT' },
      ],
    }),

    createFleetTripCheckIn: builder.mutation<
      { id: string },
      {
        id: string;
        occurredAt?: string | null;
        odometerKm?: number | null;
        latitude?: number | null;
        longitude?: number | null;
        locationLabel?: string | null;
        note?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fleet-transport/trips/${id}/check-in`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    createFleetTripCheckOut: builder.mutation<
      { id: string },
      {
        id: string;
        occurredAt?: string | null;
        odometerKm?: number | null;
        latitude?: number | null;
        longitude?: number | null;
        locationLabel?: string | null;
        note?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/fleet-transport/trips/${id}/check-out`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    startFleetTrip: builder.mutation<
      { id: string },
      { id: string; startOdometerKm?: number | null; note?: string | null }
    >({
      query: ({ id, startOdometerKm, note }) => ({
        url: `/fleet-transport/trips/${id}/start`,
        method: 'POST',
        body: { startOdometerKm: startOdometerKm ?? null, note: note ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    closeFleetTrip: builder.mutation<
      { id: string },
      { id: string; endOdometerKm?: number | null; note?: string | null }
    >({
      query: ({ id, endOdometerKm, note }) => ({
        url: `/fleet-transport/trips/${id}/close`,
        method: 'POST',
        body: { endOdometerKm: endOdometerKm ?? null, note: note ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetFuelLogs: builder.query<
      ServerListResponse<FleetFuelLog>,
      ServerListQuery<{ status?: number; vehicleId?: string; pendingOnly?: boolean }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/fuel-logs',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    getFleetFuelAnalytics: builder.query<
      FleetFuelAnalyticsResponse,
      {
        vehicleId?: string;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
        expectedOveruseThresholdPct?: number;
        defaultExpectedKmPerLiter?: number;
      } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/fuel-analytics',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'FUEL_ANALYTICS' }],
    }),

    getFleetFuelFraudSignals: builder.query<
      FleetFuelFraudSignalsResponse,
      {
        branchId?: string;
        vehicleId?: string;
        fuelType?: number;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
        expectedOveruseThresholdPct?: number;
        defaultExpectedKmPerLiter?: number;
        highCostPerKmThreshold?: number;
        rapidRefuelHours?: number;
      } | void
    >({
      query: (params) => ({
        url: '/fleet-transport/fuel-analytics/fraud-signals',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'FleetTransport', id: 'FUEL_ANALYTICS' }],
    }),

    createFleetFuelLog: builder.mutation<
      { id: string },
      {
        branchId?: string | null;
        vehicleId: string;
        liters: number;
        fuelCostPsw: number;
        odometerKm?: number | null;
        stationName?: string | null;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/fuel-logs',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    approveFleetFuelLog: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/fleet-transport/fuel-logs/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    rejectFleetFuelLog: builder.mutation<{ id: string }, { id: string; rejectionReason: string }>({
      query: ({ id, rejectionReason }) => ({
        url: `/fleet-transport/fuel-logs/${id}/reject`,
        method: 'POST',
        body: { rejectionReason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),
  }),
});

export const {
  useListFleetVehiclesQuery,
  useListFleetVehicleOptionsQuery,
  useListFleetVehicleComplianceAlertsQuery,
  useListFleetDriverOptionsQuery,
  useListFleetDriverComplianceRecordsQuery,
  useCreateFleetDriverComplianceRecordMutation,
  useListFleetDriverComplianceAlertsQuery,
  useGetFleetComplianceDashboardQuery,
  useGetFleetComplianceKpiTrendsQuery,
  useRunFleetComplianceAlertJobMutation,
  useRunFleetComplianceEscalationJobMutation,
  useGetFleetOpsQueueQuery,
  useGetFleetMaintenanceDashboardQuery,
  useListFleetMaintenancePlansQuery,
  useCreateFleetMaintenancePlanMutation,
  useUpdateFleetMaintenancePlanMutation,
  useListFleetMaintenanceWorkOrdersQuery,
  useCreateFleetMaintenanceWorkOrderMutation,
  useUpdateFleetMaintenanceWorkOrderMutation,
  useListFleetDowntimeEventsQuery,
  useCreateFleetDowntimeEventMutation,
  useCloseFleetDowntimeEventMutation,
  useReopenFleetDowntimeEventMutation,
  useListFleetDowntimeRcaWorkflowsQuery,
  useUpdateFleetDowntimeRcaWorkflowMutation,
  useListFleetReliabilityMetricsQuery,
  useGetFleetMaintenanceReliabilityTrendsQuery,
  useGetFleetMaintenanceKpiDashboardQuery,
  useListFleetMaintenanceWorkOrderPartMovementsQuery,
  useGetFleetMaintenanceProcurementTraceabilityQuery,
  useRunFleetMaintenanceReorderDemandJobMutation,
  useCreateFleetVehicleMutation,
  useUpdateFleetVehicleMutation,
  useGetFleetVehicleQuery,
  useListFleetVehicleDocumentsQuery,
  useCreateFleetVehicleDocumentMutation,
  useListFleetTripsQuery,
  useGetFleetTripQuery,
  useListFleetRoutePlansQuery,
  useGetFleetRoutePlanQuery,
  useCreateFleetRoutePlanMutation,
  useCreateFleetTripMutation,
  useAssignFleetTripRouteMutation,
  useAssignFleetTripCrewMutation,
  useListFleetTripCrewQuery,
  useListFleetTripEventsQuery,
  useListFleetTripLoadMatchesQuery,
  useListFleetTripLoadAuditTrailQuery,
  useAssignFleetTripLoadMatchMutation,
  useUpdateFleetTripLoadMatchStatusMutation,
  useListFleetTripTelemetryPointsQuery,
  useRecordFleetTripTelemetryPointMutation,
  useListFleetTripStatusUpdatesQuery,
  useRecordFleetTripStatusUpdateMutation,
  useGetFleetTripTimelineQuery,
  useListFleetShiftRostersQuery,
  useGetFleetShiftRosterQuery,
  useCreateFleetShiftRosterMutation,
  useUpdateFleetShiftRosterMutation,
  useTransitionFleetVehicleLifecycleMutation,
  useListFleetComplianceIncidentsQuery,
  useTransitionFleetComplianceIncidentCaseMutation,
  useCreateFleetComplianceIncidentMutation,
  useUpdateFleetComplianceIncidentMutation,
  useListFleetPolicyAcknowledgmentsQuery,
  useAcknowledgeFleetPolicyMutation,
  useListFleetMaintenancePartsQuery,
  useCreateFleetMaintenancePartMutation,
  useAdjustFleetMaintenancePartStockMutation,
  useListFleetMaintenancePartMovementsQuery,
  useRunFleetLowStockAlertJobMutation,
  useRunFleetMaintenanceAutomationJobMutation,
  useGetFleetDispatchBoardQuery,
  useGetFleetDispatchOpsPerformanceQuery,
  useGetFleetDispatchExceptionQueueQuery,
  useGetFleetDispatchRouteAssignmentQueueQuery,
  useGetFleetDispatchLoadCandidatesQuery,
  useGetFleetDecisionSupportOverviewQuery,
  useGetFleetExecutiveScorecardQuery,
  useGetFleetComplianceEscalationPolicyQuery,
  useUpdateFleetComplianceEscalationPolicyMutation,
  useGetFleetUnitEconomicsQuery,
  useListFleetLowStockProcurementCandidatesQuery,
  useRunFleetPolicyReackReminderJobMutation,
  useRunFleetVehicleLifecycleAutomationJobMutation,
  useRunFleetAutomationOrchestrationJobMutation,
  useRunFleetAnalyticsSnapshotJobMutation,
  useCreateFleetTripCheckInMutation,
  useCreateFleetTripCheckOutMutation,
  useStartFleetTripMutation,
  useCloseFleetTripMutation,
  useListFleetFuelLogsQuery,
  useGetFleetFuelAnalyticsQuery,
  useGetFleetFuelFraudSignalsQuery,
  useCreateFleetFuelLogMutation,
  useApproveFleetFuelLogMutation,
  useRejectFleetFuelLogMutation,
} = fleetTransportApi;
