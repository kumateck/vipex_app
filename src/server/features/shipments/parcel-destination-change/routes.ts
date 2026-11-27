import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions, type AuthUser } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import { changeParcelDestinationSvc, getParcelDestinationOptionsSvc } from './service';

export function assertParcelDestinationChangeAccess({ user }: { user: AuthUser | null }) {
  requireAuth()({ user });
  requirePermissions(PermissionKeys.CanChangeParcelDestination)({ user });
}

const guards = [assertParcelDestinationChangeAccess];
const actor = (user: AuthUser) => ({ companyId: user.companyId, actorUserId: user.sub });

export const parcelDestinationChangeRoutes = new Elysia({ name: 'parcel-destination-change' })
  .use(authPlugin)
  .get(
    '/:id/destination-options',
    ({ params, user }) =>
      getParcelDestinationOptionsSvc({ ...actor(user as AuthUser), parcelId: params.id }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: guards,
      detail: {
        tags: ['Shipments'],
        summary: 'Destination branches and pickup locations a parcel can be moved to',
      },
    },
  )
  .patch(
    '/:id/destination',
    ({ params, body, user }) =>
      changeParcelDestinationSvc({ ...actor(user as AuthUser), parcelId: params.id, ...body }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        destinationId: UUID,
        pickupLocationId: t.Optional(t.Union([UUID, t.Null()])),
        expectedDestinationId: UUID,
        expectedPickupLocationId: t.Union([UUID, t.Null()]),
        reason: t.String({ minLength: 5, maxLength: 500 }),
      }),
      beforeHandle: guards,
      detail: {
        tags: ['Shipments'],
        summary: 'Change a parcel destination branch and pickup location before dispatch',
      },
    },
  );
