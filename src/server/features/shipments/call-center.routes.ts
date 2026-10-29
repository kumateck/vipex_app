import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { listUserOptionsRepo } from '../users/repository';
import { listParcelsCtrl } from './parcels.controller';
import { callCenterParcelFilters } from './call-center-scope';
import {
  assignParcelToCallCenterSvc,
  bulkAssignParcelsToCallCenterSvc,
} from './call-center-assignment.service';

export const callCenterRoutes = new Elysia({ name: 'parcel-call-center' })
  .use(authPlugin)
  .get(
    '/call-center',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: {
          ...callCenterParcelFilters(authUser),
          statuses: [
            ParcelStatus.ARRIVED_AT_DESTINATION,
            ParcelStatus.CUSTOMER_CONTACTED,
            ParcelStatus.RETURNED_TO_OFFICE,
            ParcelStatus.AWAITING_PICKUP,
            ParcelStatus.HOME_DELIVERY_REQUESTED,
            ParcelStatus.ADDRESS_COLLECTED,
            ParcelStatus.DISPATCHED,
            ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
          ],
          callCenterUncalledOnly: true,
          callCenterAssignmentOrder: true,
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCallCenterAssignment)],
      detail: { tags: ['Shipments'], summary: 'List parcels for call center assignment' },
    },
  )
  .get(
    '/call-center/assigned',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: {
          ...callCenterParcelFilters(authUser),
          statuses: [
            ParcelStatus.ARRIVED_AT_DESTINATION,
            ParcelStatus.CUSTOMER_CONTACTED,
            ParcelStatus.RETURNED_TO_OFFICE,
            ParcelStatus.AWAITING_PICKUP,
            ParcelStatus.HOME_DELIVERY_REQUESTED,
            ParcelStatus.ADDRESS_COLLECTED,
            ParcelStatus.DISPATCHED,
            ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
          ],
          assignedToUserId: authUser.sub,
          callCenterUncalledOnly: true,
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCallCenterParcelStatus),
      ],
      detail: { tags: ['Shipments'], summary: 'List parcels assigned to the current call agent' },
    },
  )
  .get(
    '/assignment-staff',
    async ({ user }) => {
      const authUser = user as AuthUser;
      if (!authUser.companyId || !authUser.branchId) return [];
      return listUserOptionsRepo({
        companyId: authUser.companyId,
        branchId: authUser.branchId,
        locationId: authUser.locationId ?? null,
        status: UserStatus.ACTIVE,
      });
    },
    {
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCallCenterAssignment)],
      detail: { tags: ['Shipments'], summary: 'List active parcel assignment staff' },
    },
  )
  .post(
    '/bulk-assign-call-center',
    ({ body, user }) => bulkAssignParcelsToCallCenterSvc({ ...body, ...(user as AuthUser) }),
    {
      body: t.Object({
        parcelIds: t.Array(UUID, { minItems: 1, maxItems: 200, uniqueItems: true }),
        userId: UUID,
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanAssignCallCenterParcels)],
      detail: { tags: ['Shipments'], summary: 'Bulk assign parcels to call center representative' },
    },
  )
  .post(
    '/:id/assign-call-center',
    ({ params, body, user }) =>
      assignParcelToCallCenterSvc({
        ...(user as AuthUser),
        parcelId: params.id,
        userId: (body as { userId: string }).userId,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ userId: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanAssignCallCenterParcels)],
      detail: {
        tags: ['Shipments'],
        summary: 'Assign parcel to call center representative',
      },
    },
  );
