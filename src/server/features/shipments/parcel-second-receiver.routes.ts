import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../schemas/common';
import { setParcelSecondReceiverSvc } from './parcel-second-receiver.service';

export const parcelSecondReceiverRoutes = new Elysia({ name: 'parcel-second-receiver' })
  .use(authPlugin)
  .put(
    '/:id/second-receiver',
    ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return setParcelSecondReceiverSvc({
        parcelId: params.id,
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        actorUserId: authUser.sub,
        fullname: body.fullname,
        telephone: body.telephone,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.String({ minLength: 10, maxLength: 20 }),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanUpdateParcelShelfPicker,
          PermissionKeys.CanAssignCallCenterParcels,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'Add or replace the second receiver of a parcel' },
    },
  );
