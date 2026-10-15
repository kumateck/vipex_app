import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
} from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import { returnHomeDeliveryToPickupSvc } from './index';

export const homeDeliveryPickupRoutes = new Elysia({ name: 'home-delivery-pickup' })
  .use(authPlugin)
  .post(
    '/dd/:parcelId/return-to-pickup',
    ({ params, user }) => {
      const actor = user as AuthUser;
      return returnHomeDeliveryToPickupSvc({
        parcelId: params.parcelId,
        companyId: actor.companyId ?? '',
        branchId: actor.branchId ?? '',
        actorUserId: actor.sub,
        permissions: actor.permissions ?? [],
      });
    },
    {
      params: t.Object({ parcelId: UUID }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanMarkDoorstepCalled,
          PermissionKeys.CanDispatchForDelivery,
          PermissionKeys.CanCompleteDoorstepDelivery,
        ),
      ],
      detail: {
        tags: ['Deliveries'],
        summary: 'Return an unfinished home delivery to office pickup',
      },
    },
  );
