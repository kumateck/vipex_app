import { callCenterRoutes } from '../call-center.routes';
import { parcelCreditChargeRoutes } from '../parcel-credit-charge.routes';
import { parcelStorageClearanceRoutes } from '../parcel-storage-clearance.routes';
import { shelfPickerReassignmentRoutes } from '../shelf-picker-reassignment.routes';
import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { listParcelsCtrl } from '../parcels.controller';
import { listUserOptionsRepo } from '../../users/repository';
import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { getBranchRepo } from '../../branches/repository';
import {
  previewParcelFinancialRepairSvc,
  repairParcelFinancialStateSvc,
} from '../parcel-financial-repair.service';
import { emptyParcelList } from './helpers';
export const routes = new Elysia({ name: 'parcel-queues' })
  .use(authPlugin)
  .use(parcelCreditChargeRoutes)
  .get(
    '/financial-repair/preview',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      if (!authUser.companyId || !authUser.branchId) return null;
      return previewParcelFinancialRepairSvc({
        companyId: authUser.companyId,
        branchId: authUser.branchId,
        search: query.search,
      });
    },
    {
      query: t.Object({ search: t.String({ minLength: 3, maxLength: 255 }) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRepairParcelFinancialState),
      ],
      detail: { tags: ['Shipments'], summary: 'Preview parcel financial state repair' },
    },
  )
  .post(
    '/financial-repair/execute',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return repairParcelFinancialStateSvc({
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        actorUserId: authUser.sub,
        search: body.search,
        reason: body.reason,
      });
    },
    {
      body: t.Object({
        search: t.String({ minLength: 3, maxLength: 255 }),
        reason: t.String({ minLength: 5, maxLength: 500 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRepairParcelFinancialState),
      ],
      detail: { tags: ['Shipments'], summary: 'Repair parcel To Be Paid amount' },
    },
  )
  .use(parcelStorageClearanceRoutes)
  .use(shelfPickerReassignmentRoutes)
  .use(callCenterRoutes)
  .get(
    '/return-to-source',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      if (!authUser.companyId || !authUser.branchId) return emptyParcelList(query);
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: {
          companyId: authUser.companyId,
          sourceId: authUser.branchId,
          status: ParcelStatus.RETURN_TO_SOURCE,
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
      detail: {
        tags: ['Shipments'],
        summary: 'List parcels marked for return to this source branch',
      },
    },
  )
  .get(
    '/call-center/address-collection',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      if (!authUser.companyId || !authUser.branchId) return emptyParcelList(query);
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: {
          companyId: authUser.companyId,
          destinationId: authUser.branchId,
          status: ParcelStatus.HOME_DELIVERY_REQUESTED,
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanMarkDoorstepCalled)],
      detail: { tags: ['Shipments'], summary: 'List parcels awaiting doorstep address collection' },
    },
  )
  .get(
    '/shelf-picker',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      const branch = authUser.branchId ? await getBranchRepo(authUser.branchId) : null;
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort:
          branch?.usePickupQueue && !query.search?.trim()
            ? [{ field: 'pickupQueueNumber', direction: 'asc' }]
            : undefined,
        filters: {
          companyId: authUser.companyId ?? null,
          destinationId: authUser.branchId ?? null,
          status: 5,
          shelfPickerAssignmentOrder: true,
          hasPickupQueue: branch?.usePickupQueue && !query.search?.trim() ? true : undefined,
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadShelfPickerUpdate)],
      detail: { tags: ['Shipments'], summary: 'List parcels for shelf picker updates' },
    },
  )
  .get(
    '/shelf-picker-staff',
    async ({ user }) => {
      const authUser = user as AuthUser;
      if (!authUser.companyId || !authUser.branchId) return [];
      return listUserOptionsRepo({
        companyId: authUser.companyId ?? null,
        branchId: authUser.branchId,
        locationId: authUser.locationId ?? null,
        status: UserStatus.ACTIVE,
      });
    },
    {
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadShelfPickerUpdate,
          PermissionKeys.CanUpdateParcelShelfPicker,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'List active shelf picker staff' },
    },
  );
