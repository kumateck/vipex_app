import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { NonEmpty255, PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  approveFleetFuelLogCtrl,
  createFleetFuelLogCtrl,
  createFleetVehicleCtrl,
  listFleetFuelLogsCtrl,
  listFleetVehicleOptionsCtrl,
  listFleetVehiclesCtrl,
  rejectFleetFuelLogCtrl,
  updateFleetVehicleCtrl,
} from './controller';

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
