import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { NonEmpty255, PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import { FleetTripEventType } from '@/db/schemas';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  assignFleetTripLoadMatchCtrl,
  assignFleetTripCrewCtrl,
  assignFleetTripRouteCtrl,
  acknowledgeFleetPolicyCtrl,
  approveFleetFuelLogCtrl,
  closeFleetDowntimeEventCtrl,
  reopenFleetDowntimeEventCtrl,
  createFleetDowntimeEventCtrl,
  createFleetComplianceIncidentCtrl,
  transitionFleetComplianceIncidentCaseCtrl,
  updateFleetComplianceIncidentCtrl,
  createFleetMaintenancePartCtrl,
  createFleetTripEventCtrl,
  closeFleetTripCtrl,
  createFleetDriverComplianceRecordCtrl,
  createFleetMaintenancePlanCtrl,
  createFleetMaintenanceWorkOrderCtrl,
  createFleetRoutePlanCtrl,
  createFleetShiftRosterCtrl,
  createFleetTripCtrl,
  createFleetVehicleDocumentCtrl,
  createFleetFuelLogCtrl,
  createFleetVehicleCtrl,
  getFleetComplianceKpiTrendsCtrl,
  listFleetComplianceDashboardCtrl,
  listFleetVehicleComplianceAlertsCtrl,
  getFleetVehicleCtrl,
  getFleetTripCtrl,
  getFleetRoutePlanCtrl,
  getFleetShiftRosterCtrl,
  getFleetTripCrewCtrl,
  listFleetTripEventsCtrl,
  listFleetTripLoadMatchesCtrl,
  listFleetTripStatusUpdatesCtrl,
  listFleetTripTelemetryCtrl,
  getFleetTripTimelineCtrl,
  listFleetShiftRostersCtrl,
  listFleetComplianceIncidentsCtrl,
  listFleetPolicyAcknowledgmentsCtrl,
  listFleetMaintenancePartsCtrl,
  listFleetLowStockProcurementCandidatesCtrl,
  listFleetMaintenancePartMovementsCtrl,
  listFleetMaintenanceWorkOrderPartMovementsCtrl,
  listFleetDowntimeRcaWorkflowsCtrl,
  getFleetDispatchBoardCtrl,
  getFleetDispatchExceptionQueueCtrl,
  getFleetDispatchOpsPerformanceCtrl,
  listFleetDispatchRouteAssignmentQueueCtrl,
  listFleetDispatchLoadCandidatesCtrl,
  listFleetTripLoadAuditTrailCtrl,
  getFleetOpsQueueCtrl,
  getFleetDecisionSupportCtrl,
  getFleetExecutiveScorecardCtrl,
  getFleetComplianceEscalationPolicyCtrl,
  setFleetComplianceEscalationPolicyCtrl,
  getFleetUnitEconomicsCtrl,
  runFleetAnalyticsSnapshotJobCtrl,
  getFleetMaintenanceDashboardCtrl,
  getFleetMaintenanceKpiDashboardCtrl,
  getFleetMaintenanceReliabilityTrendsCtrl,
  getFleetMaintenanceProcurementTraceabilityCtrl,
  listFleetDowntimeEventsCtrl,
  listFleetMaintenancePlansCtrl,
  listFleetMaintenanceWorkOrdersCtrl,
  listFleetReliabilityMetricsCtrl,
  listFleetRoutePlansCtrl,
  listFleetTripsCtrl,
  listFleetDriverComplianceAlertsCtrl,
  listFleetDriverComplianceRecordsCtrl,
  listFleetDriverOptionsCtrl,
  listFleetVehicleDocumentsCtrl,
  listFleetFuelLogsCtrl,
  listFleetFuelAnalyticsCtrl,
  getFleetFuelFraudSignalsCtrl,
  listFleetVehicleOptionsCtrl,
  listFleetVehiclesCtrl,
  runFleetComplianceExpiryAlertJobCtrl,
  runFleetComplianceEscalationJobCtrl,
  runFleetLowStockAlertJobCtrl,
  runFleetMaintenanceAutomationJobCtrl,
  runFleetMaintenanceReorderDemandJobCtrl,
  runFleetAutomationOrchestrationJobCtrl,
  runFleetPolicyReackReminderJobCtrl,
  runFleetVehicleLifecycleAutomationJobCtrl,
  rejectFleetFuelLogCtrl,
  startFleetTripCtrl,
  recordFleetTripStatusUpdateCtrl,
  recordFleetTripTelemetryCtrl,
  updateFleetTripLoadMatchStatusCtrl,
  updateFleetShiftRosterCtrl,
  transitionFleetVehicleLifecycleCtrl,
  adjustFleetMaintenancePartStockCtrl,
  updateFleetMaintenancePlanCtrl,
  updateFleetMaintenanceWorkOrderCtrl,
  updateFleetDowntimeRcaWorkflowCtrl,
  updateFleetVehicleCtrl,
} from './controller';

function normalizeOptionalDate(value: string | Date | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value;
  return value ? new Date(value) : null;
}

export const fleetTransportRoutes = new Elysia({ name: 'fleet-transport' })
  .use(authPlugin)
  .get(
    '/vehicles/options',
    async ({ query, user }) =>
      listFleetVehicleOptionsCtrl({
        companyId: (user as AuthUser).companyId!,
        search: query.search ?? null,
        isActive: query.isActive ?? null,
      }),
    {
      query: t.Object({
        search: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet vehicle options' },
    },
  )
  .get(
    '/vehicles',
    async ({ query, user }) =>
      listFleetVehiclesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          isActive: query.isActive ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet vehicles' },
    },
  )
  .post(
    '/vehicles',
    async ({ body, set, user }) => {
      const result = await createFleetVehicleCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        plateNumber: body.plateNumber,
        model: body.model,
        year: body.year ?? null,
        vin: body.vin ?? null,
        ownershipType: body.ownershipType,
        lessorName: body.lessorName ?? null,
        leaseStartAt: body.leaseStartAt ? new Date(body.leaseStartAt) : null,
        leaseEndAt: body.leaseEndAt ? new Date(body.leaseEndAt) : null,
        fuelType: body.fuelType,
        expectedKmPerLiter: body.expectedKmPerLiter ?? null,
        tankCapacityLiters: body.tankCapacityLiters ?? null,
        payloadCapacityKg: body.payloadCapacityKg ?? null,
        cargoCapacityCbm: body.cargoCapacityCbm ?? null,
        lifecycleStatus: body.lifecycleStatus,
        insuranceExpiryAt: body.insuranceExpiryAt ? new Date(body.insuranceExpiryAt) : null,
        roadworthyExpiryAt: body.roadworthyExpiryAt ? new Date(body.roadworthyExpiryAt) : null,
        assignedDriverUserId: body.assignedDriverUserId ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        plateNumber: NonEmpty255,
        model: NonEmpty255,
        year: t.Optional(t.Union([t.Number({ minimum: 1900, maximum: 2100 }), t.Null()])),
        vin: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
        ownershipType: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
        lessorName: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        leaseStartAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        leaseEndAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        fuelType: t.Optional(t.Number({ minimum: 0, maximum: 5 })),
        expectedKmPerLiter: t.Optional(t.Union([t.Number({ minimum: 0.1 }), t.Null()])),
        tankCapacityLiters: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        payloadCapacityKg: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        cargoCapacityCbm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        lifecycleStatus: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
        insuranceExpiryAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        roadworthyExpiryAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        assignedDriverUserId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet vehicle' },
    },
  )
  .get(
    '/vehicles/compliance-alerts',
    async ({ query, user }) =>
      listFleetVehicleComplianceAlertsCtrl({
        companyId: (user as AuthUser).companyId!,
        horizonDays: query.horizonDays ?? 30,
        limit: query.limit ?? 50,
      }),
    {
      query: t.Object({
        horizonDays: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet vehicle compliance alerts' },
    },
  )
  .get(
    '/drivers/options',
    async ({ query, user }) =>
      listFleetDriverOptionsCtrl({
        companyId: (user as AuthUser).companyId!,
        search: query.search ?? null,
      }),
    {
      query: t.Object({
        search: t.Optional(t.String()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet driver options' },
    },
  )
  .get(
    '/drivers/compliance-alerts',
    async ({ query, user }) =>
      listFleetDriverComplianceAlertsCtrl({
        companyId: (user as AuthUser).companyId!,
        horizonDays: query.horizonDays ?? 30,
        limit: query.limit ?? 50,
      }),
    {
      query: t.Object({
        horizonDays: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet driver compliance alerts' },
    },
  )
  .get(
    '/compliance-dashboard',
    async ({ query, user }) =>
      listFleetComplianceDashboardCtrl({
        companyId: (user as AuthUser).companyId!,
        horizonDays: query.horizonDays ?? 60,
        limit: query.limit ?? 200,
        branchId: query.branchId ?? null,
        status: query.status ?? 'all',
      }),
    {
      query: t.Object({
        horizonDays: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        branchId: t.Optional(UUID),
        status: t.Optional(
          t.Union([
            t.Literal('all'),
            t.Literal('expired'),
            t.Literal('due_7'),
            t.Literal('due_30'),
            t.Literal('due_60'),
          ]),
        ),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Fleet compliance dashboard alerts' },
    },
  )
  .get(
    '/compliance/kpis/trends',
    async ({ query, user }) =>
      getFleetComplianceKpiTrendsCtrl({
        companyId: (user as AuthUser).companyId!,
        windowDays: query.windowDays ?? 180,
      }),
    {
      query: t.Object({
        windowDays: t.Optional(t.Number({ minimum: 30, maximum: 365 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Fleet compliance KPI trends (aging, closure SLA, policy acknowledgment)',
      },
    },
  )
  .get(
    '/ops-queue',
    async ({ query, user }) =>
      getFleetOpsQueueCtrl({
        companyId: (user as AuthUser).companyId!,
        horizonDays: query.horizonDays ?? 30,
        incidentLimit: query.incidentLimit ?? 50,
        workOrderLimit: query.workOrderLimit ?? 50,
        downtimeLimit: query.downtimeLimit ?? 50,
        lowStockLimit: query.lowStockLimit ?? 50,
        policyReackAfterDays: query.policyReackAfterDays ?? 365,
      }),
    {
      query: t.Object({
        horizonDays: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
        incidentLimit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        workOrderLimit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        downtimeLimit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        lowStockLimit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        policyReackAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 3650 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Fleet operations action queue and KPIs' },
    },
  )
  .post(
    '/analytics/snapshots/run-daily',
    async ({ body, user }) =>
      runFleetAnalyticsSnapshotJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        windowDays: body.windowDays ?? 180,
        horizonDays: body.horizonDays ?? 60,
        defaultExpectedKmPerLiter: body.defaultExpectedKmPerLiter ?? 6,
        expectedOveruseThresholdPct: body.expectedOveruseThresholdPct ?? 20,
      }),
    {
      body: t.Object({
        windowDays: t.Optional(t.Number({ minimum: 30, maximum: 365 })),
        horizonDays: t.Optional(t.Number({ minimum: 7, maximum: 365 })),
        defaultExpectedKmPerLiter: t.Optional(t.Number({ minimum: 0.1, maximum: 100 })),
        expectedOveruseThresholdPct: t.Optional(t.Number({ minimum: 0, maximum: 500 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Run daily fleet analytics snapshot hook' },
    },
  )
  .post(
    '/compliance-dashboard/alerts/run-daily',
    async ({ body, user }) =>
      runFleetComplianceExpiryAlertJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        horizonDays: body.horizonDays ?? 60,
        recipientLimit: body.recipientLimit ?? 20,
        maxAlertsInDigest: body.maxAlertsInDigest ?? 100,
      }),
    {
      body: t.Object({
        horizonDays: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
        recipientLimit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        maxAlertsInDigest: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Run daily fleet compliance alert job hook' },
    },
  )
  .post(
    '/compliance/escalations/run-daily',
    async ({ body, user }) =>
      runFleetComplianceEscalationJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        incidentEscalateAfterDays: body.incidentEscalateAfterDays ?? 3,
        incidentCriticalEscalateAfterDays: body.incidentCriticalEscalateAfterDays ?? 1,
        complianceEscalateAfterDays: body.complianceEscalateAfterDays ?? 0,
        incidentLimit: body.incidentLimit ?? 400,
        recipientLimit: body.recipientLimit ?? 20,
      }),
    {
      body: t.Object({
        incidentEscalateAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 90 })),
        incidentCriticalEscalateAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 30 })),
        complianceEscalateAfterDays: t.Optional(t.Number({ minimum: 0, maximum: 90 })),
        incidentLimit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        recipientLimit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Run daily fleet compliance escalation workflow hook',
      },
    },
  )
  .get(
    '/compliance/escalation-policy',
    async ({ user }) =>
      getFleetComplianceEscalationPolicyCtrl({
        companyId: (user as AuthUser).companyId!,
      }),
    {
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Get fleet compliance escalation policy settings',
      },
    },
  )
  .put(
    '/compliance/escalation-policy',
    async ({ body, user }) =>
      setFleetComplianceEscalationPolicyCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        policy: {
          incidentEscalateAfterDays: body.incidentEscalateAfterDays,
          incidentCriticalEscalateAfterDays: body.incidentCriticalEscalateAfterDays,
          complianceEscalateAfterDays: body.complianceEscalateAfterDays,
          policyReackAfterDays: body.policyReackAfterDays,
          incidentLimit: body.incidentLimit,
          recipientLimit: body.recipientLimit,
        },
      }),
    {
      body: t.Object({
        incidentEscalateAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 90 })),
        incidentCriticalEscalateAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 30 })),
        complianceEscalateAfterDays: t.Optional(t.Number({ minimum: 0, maximum: 90 })),
        policyReackAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 3650 })),
        incidentLimit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        recipientLimit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Update fleet compliance escalation policy settings',
      },
    },
  )
  .get(
    '/compliance/incidents',
    async ({ query, user }) =>
      listFleetComplianceIncidentsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          incidentType: query.incidentType,
          severity: query.severity,
          caseStatus: query.caseStatus,
          employeeId: query.employeeId,
          vehicleId: query.vehicleId,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        incidentType: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
        severity: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
        caseStatus: t.Optional(t.Union([t.Literal('open'), t.Literal('resolved')])),
        employeeId: t.Optional(UUID),
        vehicleId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'List fleet compliance incidents (violations/accidents)',
      },
    },
  )
  .post(
    '/compliance/incidents',
    async ({ body, set, user }) => {
      const result = await createFleetComplianceIncidentCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        tripId: body.tripId ?? null,
        vehicleId: body.vehicleId ?? null,
        employeeId: body.employeeId ?? null,
        incidentType: body.incidentType,
        severity: body.severity,
        occurredAt: new Date(body.occurredAt),
        locationLabel: body.locationLabel ?? null,
        description: body.description,
        actionTaken: body.actionTaken ?? null,
        resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        tripId: t.Optional(t.Union([UUID, t.Null()])),
        vehicleId: t.Optional(t.Union([UUID, t.Null()])),
        employeeId: t.Optional(t.Union([UUID, t.Null()])),
        incidentType: t.Number({ minimum: 0, maximum: 1 }),
        severity: t.Number({ minimum: 0, maximum: 3 }),
        occurredAt: t.String({ format: 'date-time' }),
        locationLabel: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        description: NonEmpty255,
        actionTaken: t.Optional(t.Union([t.String(), t.Null()])),
        resolvedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet compliance incident' },
    },
  )
  .patch(
    '/compliance/incidents/:id',
    async ({ params, body, user }) =>
      updateFleetComplianceIncidentCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        severity: body.severity ?? undefined,
        actionTaken: body.actionTaken ?? undefined,
        resolvedAt: body.resolvedAt == null ? body.resolvedAt : new Date(body.resolvedAt),
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        severity: t.Optional(t.Union([t.Number({ minimum: 0, maximum: 3 }), t.Null()])),
        actionTaken: t.Optional(t.Union([t.String(), t.Null()])),
        resolvedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Update compliance incident lifecycle/action' },
    },
  )
  .post(
    '/compliance/incidents/:id/transition',
    async ({ params, body, user }) =>
      transitionFleetComplianceIncidentCaseCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        action: body.action,
        actionTaken: body.actionTaken ?? undefined,
        resolvedAt: body.resolvedAt == null ? body.resolvedAt : new Date(body.resolvedAt),
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        action: t.Union([t.Literal('resolve'), t.Literal('reopen')]),
        actionTaken: t.Optional(t.Union([t.String(), t.Null()])),
        resolvedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Transition compliance incident case status (resolve/reopen)',
      },
    },
  )
  .get(
    '/compliance/policy-acknowledgments',
    async ({ query, user }) =>
      listFleetPolicyAcknowledgmentsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          policyCode: query.policyCode,
          employeeId: query.employeeId,
          userId: query.userId,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        policyCode: t.Optional(t.String({ maxLength: 100 })),
        employeeId: t.Optional(UUID),
        userId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet policy acknowledgments' },
    },
  )
  .post(
    '/compliance/policy-acknowledgments',
    async ({ body, user, set }) => {
      const result = await acknowledgeFleetPolicyCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        employeeId: body.employeeId ?? null,
        userId: body.userId ?? null,
        policyCode: body.policyCode,
        policyVersion: body.policyVersion,
        status: body.status ?? 0,
        acknowledgedAt: body.acknowledgedAt ? new Date(body.acknowledgedAt) : null,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        employeeId: t.Optional(t.Union([UUID, t.Null()])),
        userId: t.Optional(t.Union([UUID, t.Null()])),
        policyCode: t.String({ minLength: 1, maxLength: 100 }),
        policyVersion: t.String({ minLength: 1, maxLength: 30 }),
        status: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
        acknowledgedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create/update fleet policy acknowledgment' },
    },
  )
  .post(
    '/compliance/policy-acknowledgments/run-daily-reminders',
    async ({ body, user }) =>
      runFleetPolicyReackReminderJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        remindAfterDays: body.remindAfterDays ?? 365,
        limit: body.limit ?? 200,
      }),
    {
      body: t.Object({
        remindAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 3650 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Run daily policy re-acknowledgment reminder hook',
      },
    },
  )
  .get(
    '/drivers/:employeeId/compliance-records',
    async ({ params, user }) =>
      listFleetDriverComplianceRecordsCtrl({
        employeeId: params.employeeId,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ employeeId: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List driver compliance records' },
    },
  )
  .post(
    '/drivers/:employeeId/compliance-records',
    async ({ params, body, set, user }) => {
      const result = await createFleetDriverComplianceRecordCtrl({
        employeeId: params.employeeId,
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        complianceType: body.complianceType,
        documentNumber: body.documentNumber ?? null,
        issuer: body.issuer ?? null,
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        fileUrl: body.fileUrl ?? null,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ employeeId: UUID }),
      body: t.Object({
        complianceType: t.Number({ minimum: 0, maximum: 4 }),
        documentNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        issuer: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        issuedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        expiresAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        fileUrl: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create driver compliance record' },
    },
  )
  .get(
    '/maintenance/dashboard',
    async ({ query, user }) =>
      getFleetMaintenanceDashboardCtrl({
        companyId: (user as AuthUser).companyId!,
        horizonDays: query.horizonDays ?? 14,
      }),
    {
      query: t.Object({
        horizonDays: t.Optional(t.Number({ minimum: 1, maximum: 180 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Get fleet maintenance dashboard' },
    },
  )
  .get(
    '/maintenance/plans',
    async ({ query, user }) =>
      listFleetMaintenancePlansCtrl({
        companyId: (user as AuthUser).companyId!,
        vehicleId: query.vehicleId ?? null,
        isActive: query.isActive ?? null,
      }),
    {
      query: t.Object({
        vehicleId: t.Optional(UUID),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet maintenance plans' },
    },
  )
  .post(
    '/maintenance/plans',
    async ({ body, set, user }) => {
      const result = await createFleetMaintenancePlanCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        vehicleId: body.vehicleId,
        title: body.title,
        description: body.description ?? null,
        intervalUnit: body.intervalUnit,
        intervalValue: body.intervalValue,
        lastServiceAt: body.lastServiceAt ? new Date(body.lastServiceAt) : null,
        lastServiceOdometerKm: body.lastServiceOdometerKm ?? null,
        nextDueAt: body.nextDueAt ? new Date(body.nextDueAt) : null,
        nextDueOdometerKm: body.nextDueOdometerKm ?? null,
        isActive: body.isActive ?? true,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        vehicleId: UUID,
        title: NonEmpty255,
        description: t.Optional(t.Union([t.String(), t.Null()])),
        intervalUnit: t.Number({ minimum: 0, maximum: 3 }),
        intervalValue: t.Number({ minimum: 1 }),
        lastServiceAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        lastServiceOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        nextDueAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        nextDueOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet maintenance plan' },
    },
  )
  .patch(
    '/maintenance/plans/:id',
    async ({ params, body, user }) =>
      updateFleetMaintenancePlanCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        patch: {
          title: body.title,
          description: body.description,
          intervalUnit: body.intervalUnit,
          intervalValue: body.intervalValue,
          lastServiceAt: normalizeOptionalDate(body.lastServiceAt),
          lastServiceOdometerKm: body.lastServiceOdometerKm,
          nextDueAt: normalizeOptionalDate(body.nextDueAt),
          nextDueOdometerKm: body.nextDueOdometerKm,
          isActive: body.isActive,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        title: t.Optional(NonEmpty255),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        intervalUnit: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
        intervalValue: t.Optional(t.Number({ minimum: 1 })),
        lastServiceAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        lastServiceOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        nextDueAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        nextDueOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Update fleet maintenance plan' },
    },
  )
  .get(
    '/maintenance/work-orders',
    async ({ query, user }) =>
      listFleetMaintenanceWorkOrdersCtrl({
        companyId: (user as AuthUser).companyId!,
        vehicleId: query.vehicleId ?? null,
        status: query.status ?? null,
      }),
    {
      query: t.Object({
        vehicleId: t.Optional(UUID),
        status: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet maintenance work orders' },
    },
  )
  .post(
    '/maintenance/work-orders',
    async ({ body, set, user }) => {
      const result = await createFleetMaintenanceWorkOrderCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        vehicleId: body.vehicleId,
        planId: body.planId ?? null,
        title: body.title,
        description: body.description ?? null,
        estimatedCostPsw: body.estimatedCostPsw ?? 0,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        vehicleId: UUID,
        planId: t.Optional(t.Union([UUID, t.Null()])),
        title: NonEmpty255,
        description: t.Optional(t.Union([t.String(), t.Null()])),
        estimatedCostPsw: t.Optional(t.Number({ minimum: 0 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet maintenance work order' },
    },
  )
  .patch(
    '/maintenance/work-orders/:id',
    async ({ params, body, user }) =>
      updateFleetMaintenanceWorkOrderCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        patch: {
          title: body.title,
          description: body.description,
          status: body.status,
          startedOdometerKm: body.startedOdometerKm,
          completedOdometerKm: body.completedOdometerKm,
          actualCostPsw: body.actualCostPsw,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        title: t.Optional(NonEmpty255),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        status: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
        startedOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        completedOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        actualCostPsw: t.Optional(t.Number({ minimum: 0 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Update fleet maintenance work order' },
    },
  )
  .get(
    '/maintenance/downtime',
    async ({ query, user }) =>
      listFleetDowntimeEventsCtrl({
        companyId: (user as AuthUser).companyId!,
        vehicleId: query.vehicleId ?? null,
        openOnly: query.openOnly ?? null,
      }),
    {
      query: t.Object({
        vehicleId: t.Optional(UUID),
        openOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet downtime events' },
    },
  )
  .post(
    '/maintenance/downtime',
    async ({ body, set, user }) => {
      const result = await createFleetDowntimeEventCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        vehicleId: body.vehicleId,
        workOrderId: body.workOrderId ?? null,
        reason: body.reason,
        note: body.note ?? null,
        startedAt: body.startedAt ? new Date(body.startedAt) : null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        vehicleId: UUID,
        workOrderId: t.Optional(t.Union([UUID, t.Null()])),
        reason: NonEmpty255,
        note: t.Optional(t.Union([t.String(), t.Null()])),
        startedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet downtime event' },
    },
  )
  .post(
    '/maintenance/downtime/:id/close',
    async ({ params, body, user }) =>
      closeFleetDowntimeEventCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        endedAt: body.endedAt ? new Date(body.endedAt) : null,
        note: body.note ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        endedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Close fleet downtime event' },
    },
  )
  .post(
    '/maintenance/downtime/:id/reopen',
    async ({ params, body, user }) =>
      reopenFleetDowntimeEventCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        reason: body.reason ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        reason: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Reopen closed downtime event' },
    },
  )
  .get(
    '/maintenance/downtime/workflows',
    async ({ query, user }) =>
      listFleetDowntimeRcaWorkflowsCtrl({
        companyId: (user as AuthUser).companyId!,
        vehicleId: query.vehicleId ?? null,
        openOnly: query.openOnly ?? null,
        lifecycleStatus: query.lifecycleStatus ?? null,
      }),
    {
      query: t.Object({
        vehicleId: t.Optional(UUID),
        openOnly: t.Optional(t.Boolean()),
        lifecycleStatus: t.Optional(t.Number({ minimum: 0, maximum: 5 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List downtime RCA workflows' },
    },
  )
  .patch(
    '/maintenance/downtime/:id/workflow',
    async ({ params, body, user }) =>
      updateFleetDowntimeRcaWorkflowCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        patch: {
          reasonCategory: body.reasonCategory ?? null,
          lifecycleStatus: body.lifecycleStatus ?? null,
          rootCause: body.rootCause ?? null,
          correctiveAction: body.correctiveAction ?? null,
          escalationLevel: body.escalationLevel ?? null,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        reasonCategory: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        lifecycleStatus: t.Optional(t.Union([t.Number({ minimum: 0, maximum: 5 }), t.Null()])),
        rootCause: t.Optional(t.Union([t.String(), t.Null()])),
        correctiveAction: t.Optional(t.Union([t.String(), t.Null()])),
        escalationLevel: t.Optional(t.Union([t.Number({ minimum: 0, maximum: 10 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Update downtime RCA workflow' },
    },
  )
  .get(
    '/maintenance/reliability',
    async ({ query, user }) =>
      listFleetReliabilityMetricsCtrl({
        companyId: (user as AuthUser).companyId!,
        vehicleId: query.vehicleId ?? null,
      }),
    {
      query: t.Object({
        vehicleId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet reliability metrics (MTBF/MTTR)' },
    },
  )
  .get(
    '/maintenance/reliability/trends',
    async ({ query, user }) =>
      getFleetMaintenanceReliabilityTrendsCtrl({
        companyId: (user as AuthUser).companyId!,
        windowDays: query.windowDays ?? 90,
      }),
    {
      query: t.Object({
        windowDays: t.Optional(t.Number({ minimum: 7, maximum: 365 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Maintenance reliability trends by month/vehicle/branch',
      },
    },
  )
  .get(
    '/maintenance/kpis',
    async ({ query, user }) =>
      getFleetMaintenanceKpiDashboardCtrl({
        companyId: (user as AuthUser).companyId!,
        windowDays: query.windowDays ?? 30,
        slaHours: query.slaHours ?? 48,
      }),
    {
      query: t.Object({
        windowDays: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
        slaHours: t.Optional(t.Number({ minimum: 1, maximum: 24 * 30 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Maintenance KPI dashboard metrics' },
    },
  )
  .get(
    '/maintenance/parts',
    async ({ query, user }) =>
      listFleetMaintenancePartsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          branchId: query.branchId,
          isActive: query.isActive ?? undefined,
          search: query.search,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        branchId: t.Optional(UUID),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List maintenance parts inventory' },
    },
  )
  .post(
    '/maintenance/parts',
    async ({ body, user, set }) => {
      const result = await createFleetMaintenancePartCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        sku: body.sku,
        name: body.name,
        category: body.category ?? null,
        unit: body.unit ?? null,
        qtyOnHand: body.qtyOnHand ?? 0,
        reorderLevel: body.reorderLevel ?? 0,
        averageUnitCostPsw: body.averageUnitCostPsw ?? 0,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        sku: t.String({ minLength: 1, maxLength: 100 }),
        name: t.String({ minLength: 1, maxLength: 255 }),
        category: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        unit: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
        qtyOnHand: t.Optional(t.Number({ minimum: 0 })),
        reorderLevel: t.Optional(t.Number({ minimum: 0 })),
        averageUnitCostPsw: t.Optional(t.Number({ minimum: 0 })),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create maintenance part inventory item' },
    },
  )
  .post(
    '/maintenance/parts/:partId/stock-movements',
    async ({ params, body, user }) =>
      adjustFleetMaintenancePartStockCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        partId: params.partId,
        movementType: body.movementType,
        quantity: body.quantity,
        unitCostPsw: body.unitCostPsw ?? undefined,
        workOrderId: body.workOrderId ?? null,
        note: body.note ?? null,
      }),
    {
      params: t.Object({ partId: UUID }),
      body: t.Object({
        movementType: t.Number({ minimum: 0, maximum: 2 }),
        quantity: t.Number({ minimum: 0.0001 }),
        unitCostPsw: t.Optional(t.Number({ minimum: 0 })),
        workOrderId: t.Optional(t.Union([UUID, t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create maintenance part stock movement' },
    },
  )
  .get(
    '/maintenance/parts/:partId/stock-movements',
    async ({ params, query, user }) =>
      listFleetMaintenancePartMovementsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          partId: params.partId,
        },
      }),
    {
      params: t.Object({ partId: UUID }),
      query: t.Object({
        ...PaginationRequestQueryProps,
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List maintenance part stock movement history' },
    },
  )
  .get(
    '/maintenance/work-orders/:id/part-movements',
    async ({ params, query, user }) =>
      listFleetMaintenanceWorkOrderPartMovementsCtrl({
        companyId: (user as AuthUser).companyId!,
        workOrderId: params.id,
        limit: query.limit ?? 200,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'List part movements for a maintenance work order',
      },
    },
  )
  .post(
    '/maintenance/parts/alerts/run-daily',
    async ({ body, user }) =>
      runFleetLowStockAlertJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        recipientLimit: body.recipientLimit ?? 20,
        partLimit: body.partLimit ?? 100,
        branchId: body.branchId ?? null,
      }),
    {
      body: t.Object({
        recipientLimit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        partLimit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Run daily low-stock parts alert hook' },
    },
  )
  .get(
    '/maintenance/parts/procurement/candidates',
    async ({ query, user }) =>
      listFleetLowStockProcurementCandidatesCtrl({
        companyId: (user as AuthUser).companyId!,
        branchId: query.branchId ?? null,
        limit: query.limit ?? 100,
        replenishMultiplier: query.replenishMultiplier ?? 1,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        replenishMultiplier: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List low-stock procurement candidates' },
    },
  )
  .get(
    '/maintenance/procurement/traceability',
    async ({ query, user }) =>
      getFleetMaintenanceProcurementTraceabilityCtrl({
        companyId: (user as AuthUser).companyId!,
        branchId: query.branchId ?? null,
        limit: query.limit ?? 100,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Maintenance procurement traceability (demand -> PO -> receipt -> issue)',
      },
    },
  )
  .post(
    '/maintenance/procurement/reorder/run',
    async ({ body, user }) =>
      runFleetMaintenanceReorderDemandJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        dueWithinDays: body.dueWithinDays ?? 0,
        lowStockLimit: body.lowStockLimit ?? 200,
        replenishMultiplier: body.replenishMultiplier ?? 1,
      }),
    {
      body: t.Object({
        dueWithinDays: t.Optional(t.Number({ minimum: 0, maximum: 60 })),
        lowStockLimit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        replenishMultiplier: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Run maintenance reorder demand creation job' },
    },
  )
  .post(
    '/maintenance/automation/run-daily',
    async ({ body, user }) =>
      runFleetMaintenanceAutomationJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        dueWithinDays: body.dueWithinDays ?? 0,
        planLimit: body.planLimit ?? 400,
        autoCreateWorkOrders: body.autoCreateWorkOrders ?? true,
        autoCreateProcurementDemands: body.autoCreateProcurementDemands ?? true,
        lowStockLimit: body.lowStockLimit ?? 200,
        replenishMultiplier: body.replenishMultiplier ?? 1,
      }),
    {
      body: t.Object({
        dueWithinDays: t.Optional(t.Number({ minimum: 0, maximum: 60 })),
        planLimit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        autoCreateWorkOrders: t.Optional(t.Boolean()),
        autoCreateProcurementDemands: t.Optional(t.Boolean()),
        lowStockLimit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        replenishMultiplier: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Run daily fleet maintenance/procurement automation hook',
      },
    },
  )
  .post(
    '/automation/run-daily',
    async ({ body, user }) =>
      runFleetAutomationOrchestrationJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        lifecycleLimit: body.lifecycleLimit ?? 300,
        dueWithinDays: body.dueWithinDays ?? 0,
        planLimit: body.planLimit ?? 400,
        incidentEscalateAfterDays: body.incidentEscalateAfterDays ?? 3,
        incidentCriticalEscalateAfterDays: body.incidentCriticalEscalateAfterDays ?? 1,
        complianceEscalateAfterDays: body.complianceEscalateAfterDays ?? 0,
        incidentLimit: body.incidentLimit ?? 400,
        recipientLimit: body.recipientLimit ?? 20,
        autoCreateProcurementDemands: body.autoCreateProcurementDemands ?? true,
        lowStockLimit: body.lowStockLimit ?? 200,
        replenishMultiplier: body.replenishMultiplier ?? 1,
      }),
    {
      body: t.Object({
        lifecycleLimit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        dueWithinDays: t.Optional(t.Number({ minimum: 0, maximum: 60 })),
        planLimit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        incidentEscalateAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 90 })),
        incidentCriticalEscalateAfterDays: t.Optional(t.Number({ minimum: 1, maximum: 30 })),
        complianceEscalateAfterDays: t.Optional(t.Number({ minimum: 0, maximum: 90 })),
        incidentLimit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        recipientLimit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        autoCreateProcurementDemands: t.Optional(t.Boolean()),
        lowStockLimit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
        replenishMultiplier: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Run unified daily fleet automation orchestration hook',
      },
    },
  )
  .patch(
    '/vehicles/:id',
    async ({ params, body, user }) =>
      updateFleetVehicleCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        patch: {
          branchId: body.branchId,
          plateNumber: body.plateNumber,
          model: body.model,
          year: body.year,
          vin: body.vin,
          ownershipType: body.ownershipType,
          lessorName: body.lessorName,
          leaseStartAt: normalizeOptionalDate(body.leaseStartAt),
          leaseEndAt: normalizeOptionalDate(body.leaseEndAt),
          fuelType: body.fuelType,
          expectedKmPerLiter: body.expectedKmPerLiter,
          tankCapacityLiters: body.tankCapacityLiters,
          payloadCapacityKg: body.payloadCapacityKg,
          cargoCapacityCbm: body.cargoCapacityCbm,
          lifecycleStatus: body.lifecycleStatus,
          insuranceExpiryAt: normalizeOptionalDate(body.insuranceExpiryAt),
          roadworthyExpiryAt: normalizeOptionalDate(body.roadworthyExpiryAt),
          assignedDriverUserId: body.assignedDriverUserId,
          isActive: body.isActive,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        plateNumber: t.Optional(NonEmpty255),
        model: t.Optional(NonEmpty255),
        year: t.Optional(t.Union([t.Number({ minimum: 1900, maximum: 2100 }), t.Null()])),
        vin: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
        ownershipType: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
        lessorName: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        leaseStartAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        leaseEndAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        fuelType: t.Optional(t.Number({ minimum: 0, maximum: 5 })),
        expectedKmPerLiter: t.Optional(t.Union([t.Number({ minimum: 0.1 }), t.Null()])),
        tankCapacityLiters: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        payloadCapacityKg: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        cargoCapacityCbm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        lifecycleStatus: t.Optional(t.Number({ minimum: 0, maximum: 3 })),
        insuranceExpiryAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        roadworthyExpiryAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        assignedDriverUserId: t.Optional(t.Union([UUID, t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Update fleet vehicle' },
    },
  )
  .get(
    '/vehicles/:id',
    async ({ params, user }) =>
      getFleetVehicleCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Get fleet vehicle' },
    },
  )
  .patch(
    '/vehicles/:id/lifecycle',
    async ({ params, body, user }) =>
      transitionFleetVehicleLifecycleCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        lifecycleStatus: body.lifecycleStatus,
        note: body.note ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        lifecycleStatus: t.Number({ minimum: 0, maximum: 3 }),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Transition fleet vehicle lifecycle status' },
    },
  )
  .post(
    '/vehicles/lifecycle/run-daily-automation',
    async ({ body, user }) =>
      runFleetVehicleLifecycleAutomationJobCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        limit: body.limit ?? 200,
      }),
    {
      body: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Run vehicle lifecycle auto-transition hook' },
    },
  )
  .get(
    '/vehicles/:id/documents',
    async ({ params, user }) =>
      listFleetVehicleDocumentsCtrl({
        vehicleId: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet vehicle documents' },
    },
  )
  .post(
    '/vehicles/:id/documents',
    async ({ params, body, set, user }) => {
      const result = await createFleetVehicleDocumentCtrl({
        vehicleId: params.id,
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        documentType: body.documentType,
        documentNumber: body.documentNumber ?? null,
        issuer: body.issuer ?? null,
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        fileUrl: body.fileUrl ?? null,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        documentType: NonEmpty255,
        documentNumber: t.Optional(t.Union([t.String({ maxLength: 100 }), t.Null()])),
        issuer: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        issuedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        expiresAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        fileUrl: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateFleetVehicles),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet vehicle document' },
    },
  )
  .get(
    '/routes/plans',
    async ({ query, user }) =>
      listFleetRoutePlansCtrl({
        companyId: (user as AuthUser).companyId!,
        isActive: query.isActive ?? null,
        branchId: query.branchId ?? null,
      }),
    {
      query: t.Object({
        isActive: t.Optional(t.Boolean()),
        branchId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet route plans' },
    },
  )
  .post(
    '/routes/plans',
    async ({ body, set, user }) => {
      const result = await createFleetRoutePlanCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        name: body.name,
        code: body.code ?? null,
        originLabel: body.originLabel ?? null,
        destinationLabel: body.destinationLabel ?? null,
        distanceKm: body.distanceKm ?? null,
        estimatedDurationMin: body.estimatedDurationMin ?? null,
        isActive: body.isActive ?? true,
        stops: (body.stops ?? []).map((stop) => ({
          sequenceNo: stop.sequenceNo,
          label: stop.label,
          address: stop.address ?? null,
          latitude: stop.latitude ?? null,
          longitude: stop.longitude ?? null,
          plannedArrivalOffsetMin: stop.plannedArrivalOffsetMin ?? null,
          note: stop.note ?? null,
        })),
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        name: NonEmpty255,
        code: t.Optional(t.Union([t.String({ maxLength: 64 }), t.Null()])),
        originLabel: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        destinationLabel: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        distanceKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        estimatedDurationMin: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        isActive: t.Optional(t.Boolean()),
        stops: t.Optional(
          t.Array(
            t.Object({
              sequenceNo: t.Number({ minimum: 1 }),
              label: NonEmpty255,
              address: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
              latitude: t.Optional(t.Union([t.Number({ minimum: -90, maximum: 90 }), t.Null()])),
              longitude: t.Optional(t.Union([t.Number({ minimum: -180, maximum: 180 }), t.Null()])),
              plannedArrivalOffsetMin: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
              note: t.Optional(t.Union([t.String(), t.Null()])),
            }),
          ),
        ),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet route plan' },
    },
  )
  .get(
    '/routes/plans/:id',
    async ({ params, user }) =>
      getFleetRoutePlanCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Get fleet route plan with stops' },
    },
  )
  .get(
    '/trips',
    async ({ query, user }) =>
      listFleetTripsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          status: query.status,
          vehicleId: query.vehicleId,
          driverEmployeeId: query.driverEmployeeId,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        status: t.Optional(t.Number()),
        vehicleId: t.Optional(UUID),
        driverEmployeeId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet trips' },
    },
  )
  .post(
    '/trips',
    async ({ body, set, user }) => {
      const result = await createFleetTripCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        vehicleId: body.vehicleId,
        routePlanId: body.routePlanId ?? null,
        driverEmployeeId: body.driverEmployeeId,
        crewEmployeeIds: body.crewEmployeeIds ?? [],
        plannedStartAt: body.plannedStartAt ? new Date(body.plannedStartAt) : null,
        plannedEndAt: body.plannedEndAt ? new Date(body.plannedEndAt) : null,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        vehicleId: UUID,
        routePlanId: t.Optional(t.Union([UUID, t.Null()])),
        driverEmployeeId: UUID,
        crewEmployeeIds: t.Optional(t.Array(UUID)),
        plannedStartAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        plannedEndAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet trip' },
    },
  )
  .put(
    '/trips/:id/route-assignment',
    async ({ params, body, user }) =>
      assignFleetTripRouteCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        routePlanId: body.routePlanId ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        routePlanId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanAssignFleetCrew),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Assign or clear route plan for trip' },
    },
  )
  .put(
    '/trips/:id/crew',
    async ({ params, body, user }) =>
      assignFleetTripCrewCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        crewEmployeeIds: body.crewEmployeeIds,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        crewEmployeeIds: t.Array(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanAssignFleetCrew),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Assign fleet trip crew' },
    },
  )
  .get(
    '/trips/:id',
    async ({ params, user }) =>
      getFleetTripCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Get fleet trip' },
    },
  )
  .get(
    '/trips/:id/crew',
    async ({ params, user }) =>
      getFleetTripCrewCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet trip crew' },
    },
  )
  .get(
    '/trips/:id/events',
    async ({ params, user }) =>
      listFleetTripEventsCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet trip check-in/check-out events' },
    },
  )
  .get(
    '/trips/:id/loads',
    async ({ params, user }) =>
      listFleetTripLoadMatchesCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List trip load matches' },
    },
  )
  .get(
    '/trips/:id/loads/audit',
    async ({ params, query, user }) =>
      listFleetTripLoadAuditTrailCtrl({
        tripId: params.id,
        companyId: (user as AuthUser).companyId!,
        limit: query.limit ?? 200,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List trip load matching audit trail' },
    },
  )
  .post(
    '/trips/:id/loads',
    async ({ params, body, user, set }) => {
      const result = await assignFleetTripLoadMatchCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        parcelId: body.parcelId,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        parcelId: UUID,
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanAssignFleetCrew),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Assign parcel load to trip' },
    },
  )
  .patch(
    '/trips/load-matches/:loadMatchId/status',
    async ({ params, body, user }) =>
      updateFleetTripLoadMatchStatusCtrl({
        loadMatchId: params.loadMatchId,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        status: body.status,
        note: body.note ?? null,
      }),
    {
      params: t.Object({ loadMatchId: UUID }),
      body: t.Object({
        status: t.Number({ minimum: 0, maximum: 3 }),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanAssignFleetCrew),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Update trip load match status' },
    },
  )
  .get(
    '/trips/:id/telemetry',
    async ({ params, query, user }) =>
      listFleetTripTelemetryCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        limit: query.limit ?? 200,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List trip telemetry points' },
    },
  )
  .post(
    '/trips/:id/telemetry',
    async ({ params, body, user, set }) => {
      const result = await recordFleetTripTelemetryCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        sampledAt: normalizeOptionalDate(body.sampledAt),
        latitude: body.latitude,
        longitude: body.longitude,
        speedKph: body.speedKph ?? null,
        headingDeg: body.headingDeg ?? null,
        altitudeM: body.altitudeM ?? null,
        accuracyM: body.accuracyM ?? null,
        source: body.source ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        sampledAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        latitude: t.Number({ minimum: -90, maximum: 90 }),
        longitude: t.Number({ minimum: -180, maximum: 180 }),
        speedKph: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        headingDeg: t.Optional(t.Union([t.Number({ minimum: 0, maximum: 360 }), t.Null()])),
        altitudeM: t.Optional(t.Union([t.Number(), t.Null()])),
        accuracyM: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        source: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanStartFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Record trip telemetry point' },
    },
  )
  .get(
    '/trips/:id/status-updates',
    async ({ params, user }) =>
      listFleetTripStatusUpdatesCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List trip status updates' },
    },
  )
  .post(
    '/trips/:id/status-updates',
    async ({ params, body, user, set }) => {
      const result = await recordFleetTripStatusUpdateCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        statusType: body.statusType,
        occurredAt: normalizeOptionalDate(body.occurredAt),
        locationLabel: body.locationLabel ?? null,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        statusType: t.Number({ minimum: 0, maximum: 4 }),
        occurredAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        locationLabel: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanStartFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Record trip status update' },
    },
  )
  .get(
    '/trips/:id/timeline',
    async ({ params, user }) =>
      getFleetTripTimelineCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Get unified trip timeline' },
    },
  )
  .post(
    '/trips/:id/check-in',
    async ({ params, body, user, set }) => {
      const result = await createFleetTripEventCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        eventType: FleetTripEventType.CHECK_IN,
        occurredAt: normalizeOptionalDate(body.occurredAt),
        odometerKm: body.odometerKm ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        locationLabel: body.locationLabel ?? null,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        occurredAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        odometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        latitude: t.Optional(t.Union([t.Number({ minimum: -90, maximum: 90 }), t.Null()])),
        longitude: t.Optional(t.Union([t.Number({ minimum: -180, maximum: 180 }), t.Null()])),
        locationLabel: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanStartFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Record fleet trip check-in event' },
    },
  )
  .post(
    '/trips/:id/check-out',
    async ({ params, body, user, set }) => {
      const result = await createFleetTripEventCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        eventType: FleetTripEventType.CHECK_OUT,
        occurredAt: normalizeOptionalDate(body.occurredAt),
        odometerKm: body.odometerKm ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        locationLabel: body.locationLabel ?? null,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        occurredAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        odometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        latitude: t.Optional(t.Union([t.Number({ minimum: -90, maximum: 90 }), t.Null()])),
        longitude: t.Optional(t.Union([t.Number({ minimum: -180, maximum: 180 }), t.Null()])),
        locationLabel: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCloseFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Record fleet trip check-out event' },
    },
  )
  .get(
    '/rosters',
    async ({ query, user }) =>
      listFleetShiftRostersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          branchId: query.branchId,
          employeeId: query.employeeId,
          vehicleId: query.vehicleId,
          status: query.status,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        branchId: t.Optional(UUID),
        employeeId: t.Optional(UUID),
        vehicleId: t.Optional(UUID),
        status: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fleet shift rosters' },
    },
  )
  .get(
    '/rosters/:id',
    async ({ params, user }) =>
      getFleetShiftRosterCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Get fleet shift roster by id' },
    },
  )
  .post(
    '/rosters',
    async ({ body, user, set }) => {
      const result = await createFleetShiftRosterCtrl({
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        employeeId: body.employeeId,
        vehicleId: body.vehicleId ?? null,
        roleType: body.roleType,
        shiftStartAt: new Date(body.shiftStartAt),
        shiftEndAt: new Date(body.shiftEndAt),
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        employeeId: UUID,
        vehicleId: t.Optional(t.Union([UUID, t.Null()])),
        roleType: t.Number({ minimum: 0, maximum: 1 }),
        shiftStartAt: t.String({ format: 'date-time' }),
        shiftEndAt: t.String({ format: 'date-time' }),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanAssignFleetCrew),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fleet shift roster' },
    },
  )
  .patch(
    '/rosters/:id',
    async ({ params, body, user }) =>
      updateFleetShiftRosterCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        vehicleId: body.vehicleId ?? undefined,
        status: body.status ?? undefined,
        shiftStartAt: body.shiftStartAt ? new Date(body.shiftStartAt) : undefined,
        shiftEndAt: body.shiftEndAt ? new Date(body.shiftEndAt) : undefined,
        note: body.note ?? undefined,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        vehicleId: t.Optional(t.Union([UUID, t.Null()])),
        status: t.Optional(t.Union([t.Number({ minimum: 0, maximum: 2 }), t.Null()])),
        shiftStartAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        shiftEndAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanAssignFleetCrew),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Update fleet shift roster' },
    },
  )
  .post(
    '/trips/:id/start',
    async ({ params, body, user }) =>
      startFleetTripCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        startOdometerKm: body.startOdometerKm ?? null,
        note: body.note ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        startOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanStartFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Start fleet trip' },
    },
  )
  .post(
    '/trips/:id/close',
    async ({ params, body, user }) =>
      closeFleetTripCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        endOdometerKm: body.endOdometerKm ?? null,
        note: body.note ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        endOdometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCloseFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Close fleet trip' },
    },
  )
  .get(
    '/fuel-analytics',
    async ({ query, user }) =>
      listFleetFuelAnalyticsCtrl({
        companyId: (user as AuthUser).companyId!,
        vehicleId: query.vehicleId ?? null,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : null,
        dateTo: query.dateTo ? new Date(query.dateTo) : null,
        limit: query.limit ?? 100,
        expectedOveruseThresholdPct: query.expectedOveruseThresholdPct ?? 20,
        defaultExpectedKmPerLiter: query.defaultExpectedKmPerLiter ?? 6,
      }),
    {
      query: t.Object({
        vehicleId: t.Optional(UUID),
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 300 })),
        expectedOveruseThresholdPct: t.Optional(t.Number({ minimum: 0, maximum: 500 })),
        defaultExpectedKmPerLiter: t.Optional(t.Number({ minimum: 0.1, maximum: 100 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Fuel expected-vs-actual analytics with anomaly flags',
      },
    },
  )
  .get(
    '/fuel-analytics/fraud-signals',
    async ({ query, user }) =>
      getFleetFuelFraudSignalsCtrl({
        companyId: (user as AuthUser).companyId!,
        branchId: query.branchId ?? null,
        vehicleId: query.vehicleId ?? null,
        fuelType: query.fuelType ?? null,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : null,
        dateTo: query.dateTo ? new Date(query.dateTo) : null,
        limit: query.limit ?? 200,
        expectedOveruseThresholdPct: query.expectedOveruseThresholdPct ?? 20,
        defaultExpectedKmPerLiter: query.defaultExpectedKmPerLiter ?? 6,
        highCostPerKmThreshold: query.highCostPerKmThreshold ?? 3,
        rapidRefuelHours: query.rapidRefuelHours ?? 12,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        vehicleId: t.Optional(UUID),
        fuelType: t.Optional(t.Number({ minimum: 0, maximum: 5 })),
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        expectedOveruseThresholdPct: t.Optional(t.Number({ minimum: 0, maximum: 500 })),
        defaultExpectedKmPerLiter: t.Optional(t.Number({ minimum: 0.1, maximum: 100 })),
        highCostPerKmThreshold: t.Optional(t.Number({ minimum: 0, maximum: 1000 })),
        rapidRefuelHours: t.Optional(t.Number({ minimum: 1, maximum: 72 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Fuel fraud/anomaly risk signals' },
    },
  )
  .get(
    '/dispatch/board',
    async ({ user }) =>
      getFleetDispatchBoardCtrl({
        companyId: (user as AuthUser).companyId!,
      }),
    {
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Dispatch board summary metrics' },
    },
  )
  .get(
    '/dispatch/ops-performance',
    async ({ query, user }) =>
      getFleetDispatchOpsPerformanceCtrl({
        companyId: (user as AuthUser).companyId!,
        windowDays: query.windowDays ?? 30,
      }),
    {
      query: t.Object({
        windowDays: t.Optional(t.Number({ minimum: 1, maximum: 180 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Dispatch operational performance metrics' },
    },
  )
  .get(
    '/dispatch/exception-queue',
    async ({ query, user }) =>
      getFleetDispatchExceptionQueueCtrl({
        companyId: (user as AuthUser).companyId!,
        branchId: query.branchId ?? null,
        limit: query.limit ?? 300,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Dispatch exception queue (schedule gaps, conflicts, delayed trips)',
      },
    },
  )
  .get(
    '/dispatch/route-assignment-queue',
    async ({ query, user }) =>
      listFleetDispatchRouteAssignmentQueueCtrl({
        companyId: (user as AuthUser).companyId!,
        branchId: query.branchId ?? null,
        limit: query.limit ?? 300,
      }),
    {
      query: t.Object({
        branchId: t.Optional(UUID),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Dispatch route assignment queue with conflict flags',
      },
    },
  )
  .get(
    '/dispatch/load-candidates',
    async ({ query, user }) =>
      listFleetDispatchLoadCandidatesCtrl({
        companyId: (user as AuthUser).companyId!,
        tripId: query.tripId,
        search: query.search ?? null,
        limit: query.limit ?? 100,
      }),
    {
      query: t.Object({
        tripId: UUID,
        search: t.Optional(t.String()),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTrips),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Dispatch load candidate queue for trip load matching',
      },
    },
  )
  .get(
    '/decision-support/overview',
    async ({ query, user }) =>
      getFleetDecisionSupportCtrl({
        companyId: (user as AuthUser).companyId!,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : null,
        dateTo: query.dateTo ? new Date(query.dateTo) : null,
        expectedOveruseThresholdPct: query.expectedOveruseThresholdPct ?? 20,
        defaultExpectedKmPerLiter: query.defaultExpectedKmPerLiter ?? 6,
      }),
    {
      query: t.Object({
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        expectedOveruseThresholdPct: t.Optional(t.Number({ minimum: 0, maximum: 500 })),
        defaultExpectedKmPerLiter: t.Optional(t.Number({ minimum: 0.1, maximum: 100 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Decision support overview (utilization, on-time, scorecards, profitability)',
      },
    },
  )
  .get(
    '/decision-support/executive-scorecard',
    async ({ query, user }) =>
      getFleetExecutiveScorecardCtrl({
        companyId: (user as AuthUser).companyId!,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : null,
        dateTo: query.dateTo ? new Date(query.dateTo) : null,
        expectedOveruseThresholdPct: query.expectedOveruseThresholdPct ?? 20,
        defaultExpectedKmPerLiter: query.defaultExpectedKmPerLiter ?? 6,
        onTimeTargetPct: query.onTimeTargetPct,
        routeCoverageTargetPct: query.routeCoverageTargetPct,
        checkOutCoverageTargetPct: query.checkOutCoverageTargetPct,
        mttrTargetHours: query.mttrTargetHours,
      }),
    {
      query: t.Object({
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        expectedOveruseThresholdPct: t.Optional(t.Number({ minimum: 0, maximum: 500 })),
        defaultExpectedKmPerLiter: t.Optional(t.Number({ minimum: 0.1, maximum: 100 })),
        onTimeTargetPct: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        routeCoverageTargetPct: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        checkOutCoverageTargetPct: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
        mttrTargetHours: t.Optional(t.Number({ minimum: 1, maximum: 720 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Executive fleet scorecard with target variance',
      },
    },
  )
  .get(
    '/decision-support/unit-economics',
    async ({ query, user }) =>
      getFleetUnitEconomicsCtrl({
        companyId: (user as AuthUser).companyId!,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : null,
        dateTo: query.dateTo ? new Date(query.dateTo) : null,
        expectedOveruseThresholdPct: query.expectedOveruseThresholdPct ?? 20,
        defaultExpectedKmPerLiter: query.defaultExpectedKmPerLiter ?? 6,
      }),
    {
      query: t.Object({
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        expectedOveruseThresholdPct: t.Optional(t.Number({ minimum: 0, maximum: 500 })),
        defaultExpectedKmPerLiter: t.Optional(t.Number({ minimum: 0.1, maximum: 100 })),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: {
        tags: ['FleetTransport'],
        summary: 'Unit economics cuts (route, branch, customer) with benchmark slices',
      },
    },
  )
  .get(
    '/fuel-logs',
    async ({ query, user }) =>
      listFleetFuelLogsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          status: query.status,
          vehicleId: query.vehicleId,
          pendingOnly: query.pendingOnly ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        status: t.Optional(t.Number()),
        vehicleId: t.Optional(UUID),
        pendingOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetTransport),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'List fuel logs' },
    },
  )
  .post(
    '/fuel-logs',
    async ({ body, set, user }) => {
      const result = await createFleetFuelLogCtrl({
        companyId: (user as AuthUser).companyId!,
        loggedByUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        vehicleId: body.vehicleId,
        liters: body.liters,
        fuelCostPsw: body.fuelCostPsw,
        odometerKm: body.odometerKm ?? null,
        stationName: body.stationName ?? null,
        note: body.note ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        vehicleId: UUID,
        liters: t.Number({ minimum: 0 }),
        fuelCostPsw: t.Number({ minimum: 0 }),
        odometerKm: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        stationName: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateFleetFuelLogs),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Create fuel log' },
    },
  )
  .post(
    '/fuel-logs/:id/approve',
    async ({ params, user }) =>
      approveFleetFuelLogCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveFleetFuelLogs),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Approve fuel log' },
    },
  )
  .post(
    '/fuel-logs/:id/reject',
    async ({ params, body, user }) =>
      rejectFleetFuelLogCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
        rejectionReason: body.rejectionReason,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ rejectionReason: NonEmpty255 }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveFleetFuelLogs),
        requireModuleEnabled('fleet_transport'),
      ],
      detail: { tags: ['FleetTransport'], summary: 'Reject fuel log' },
    },
  );
