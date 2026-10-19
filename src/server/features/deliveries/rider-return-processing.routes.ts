import { Elysia, t } from 'elysia';
import { ParcelStatus, UserStatus, UserType } from '@/db/schemas/enums';
import { listParcelsCtrl } from '@/server/features/shipments/parcels.controller';
import { listUserOptionsRepo } from '@/server/features/users/repository';
import { UUID } from '@/server/schemas/common';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  reprocessRiderReturnForPickupSvc,
  redispatchRiderReturnSvc,
  redispatchRiderReturnsBulkSvc,
} from './rider-return-processing.service';

export const riderReturnProcessingRoutes = new Elysia({ name: 'rider-return-processing' })
  .use(authPlugin)
  .get(
    '/dd/returned',
    ({ query, user }) => {
      const actor = user as AuthUser;
      if (!actor.companyId || !actor.branchId) {
        return {
          data: [],
          meta: {
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 20,
            totalRecords: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: {
          companyId: actor.companyId,
          destinationId: actor.branchId,
          status: ParcelStatus.RETURNED_TO_OFFICE,
          riderReturnedOnly: true,
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDispatchForDelivery)],
      detail: {
        tags: ['Deliveries'],
        summary: 'List rider-returned parcels at the current branch',
      },
    },
  )
  .get(
    '/dd/returned/riders',
    async ({ user }) => {
      const actor = user as AuthUser;
      if (!actor.companyId || !actor.branchId) return [];
      const riders = await listUserOptionsRepo({
        companyId: actor.companyId,
        branchId: actor.branchId,
        userType: UserType.RIDER,
        status: UserStatus.ACTIVE,
      });
      return riders.map(({ id, fullname }) => ({ id, fullname }));
    },
    {
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDispatchForDelivery)],
      detail: { tags: ['Deliveries'], summary: 'List active branch riders for return redispatch' },
    },
  )
  .post(
    '/dd/:parcelId/returned-to-pickup',
    ({ params, user }) => {
      const actor = user as AuthUser;
      return reprocessRiderReturnForPickupSvc({
        parcelId: params.parcelId,
        companyId: actor.companyId ?? '',
        branchId: actor.branchId ?? '',
        actorUserId: actor.sub,
      });
    },
    {
      params: t.Object({ parcelId: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDispatchForDelivery)],
      detail: { tags: ['Deliveries'], summary: 'Reprocess a rider return for office pickup' },
    },
  )
  .post(
    '/dd/:parcelId/redispatch-return',
    ({ params, body, user }) => {
      const actor = user as AuthUser;
      return redispatchRiderReturnSvc({
        parcelId: params.parcelId,
        riderUserId: body.riderUserId,
        companyId: actor.companyId ?? '',
        branchId: actor.branchId ?? '',
        actorUserId: actor.sub,
      });
    },
    {
      params: t.Object({ parcelId: UUID }),
      body: t.Object({ riderUserId: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDispatchForDelivery)],
      detail: {
        tags: ['Deliveries'],
        summary: 'Redispatch a rider return to an active branch rider',
      },
    },
  )
  .post(
    '/dd/returned/redispatch-bulk',
    ({ body, user }) => {
      const actor = user as AuthUser;
      return redispatchRiderReturnsBulkSvc({
        parcelIds: body.parcelIds,
        riderUserId: body.riderUserId,
        companyId: actor.companyId ?? '',
        branchId: actor.branchId ?? '',
        actorUserId: actor.sub,
      });
    },
    {
      body: t.Object({
        parcelIds: t.Array(UUID, { minItems: 1, maxItems: 100 }),
        riderUserId: UUID,
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDispatchForDelivery)],
      detail: {
        tags: ['Deliveries'],
        summary: 'Redispatch rider returns to an active branch rider in bulk',
      },
    },
  );
