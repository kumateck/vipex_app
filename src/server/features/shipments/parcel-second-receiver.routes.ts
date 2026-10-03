import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../schemas/common';
import {
  removeParcelSecondReceiverSvc,
  setParcelSecondReceiverSvc,
} from './parcel-second-receiver.service';

const actorContext = (parcelId: string, user: unknown) => {
  const authUser = user as AuthUser;
  return {
    parcelId,
    companyId: authUser.companyId ?? '',
    branchId: authUser.branchId ?? '',
    actorUserId: authUser.sub,
  };
};

const guard = [requireAuth(), requirePermissions(PermissionKeys.CanManageParcelSecondReceiver)];

export const parcelSecondReceiverRoutes = new Elysia({ name: 'parcel-second-receiver' })
  .use(authPlugin)
  .put(
    '/:id/second-receiver',
    ({ params, body, user }) =>
      setParcelSecondReceiverSvc({
        ...actorContext(params.id, user),
        fullname: body.fullname,
        telephone: body.telephone,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.String({ minLength: 10, maxLength: 20 }),
      }),
      beforeHandle: guard,
      detail: { tags: ['Shipments'], summary: 'Add or replace the second receiver of a parcel' },
    },
  )
  .delete(
    '/:id/second-receiver',
    ({ params, user }) => removeParcelSecondReceiverSvc(actorContext(params.id, user)),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: guard,
      detail: { tags: ['Shipments'], summary: 'Remove the second receiver of a parcel' },
    },
  );
