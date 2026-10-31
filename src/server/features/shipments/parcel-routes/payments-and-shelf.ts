import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../../schemas/common';
import {
  updateParcelShelfPickerCtrl,
  setPlannedToBePaidCtrl,
  softDeleteParcelCtrl,
} from '../parcels.controller';
import { requestShelfPickerHomeDeliverySvc } from '../shelf-picker-home-delivery.service';
export const routes = new Elysia({ name: 'parcel-payments-and-shelf' })
  .use(authPlugin)
  .post(
    '/:id/planned-tobepaid',
    async ({ params, body }) =>
      setPlannedToBePaidCtrl(
        params.id,
        (body as { plannedToBePaidCedis: number | string }).plannedToBePaidCedis,
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ plannedToBePaidCedis: t.Union([t.Number(), t.String()]) }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcels)],
      detail: { tags: ['Shipments'], summary: 'Set planned to-be-paid (principal)' },
    },
  )
  .post(
    '/:id/soft-delete',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return softDeleteParcelCtrl({
        parcelId: params.id,
        actorUserId: authUser.sub,
        reason: (body as { reason: string }).reason,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        reason: t.String({ minLength: 3, maxLength: 500 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanSoftDeleteParcelsAndPayments),
      ],
      detail: {
        tags: ['Shipments'],
        summary: 'Soft delete parcel and soft-delete (void) associated payments with reason',
      },
    },
  )
  .post(
    '/:id/shelf-picker/request-delivery',
    ({ params, user }) => {
      const actor = user as AuthUser;
      return requestShelfPickerHomeDeliverySvc({
        parcelId: params.id,
        companyId: actor.companyId ?? '',
        branchId: actor.branchId ?? '',
        actorUserId: actor.sub,
      });
    },
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcelShelfPicker)],
      detail: { tags: ['Shipments'], summary: 'Request home delivery from shelf picker' },
    },
  )
  .post(
    '/:id/update-shelf-picker',
    async ({ params, body, user }) =>
      updateParcelShelfPickerCtrl({
        parcelId: params.id,
        userId: (body as { userId: string }).userId,
        companyId: (user as AuthUser).companyId ?? '',
        branchId: (user as AuthUser).branchId ?? '',
        locationId: (user as AuthUser).locationId,
        actorUserId: (user as AuthUser).sub,
        expectedPickerStaffId: (body as { expectedPickerStaffId?: string | null })
          .expectedPickerStaffId,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        userId: UUID,
        expectedPickerStaffId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcelShelfPicker)],
      detail: { tags: ['Shipments'], summary: 'Update shelf picker for parcel' },
    },
  );
