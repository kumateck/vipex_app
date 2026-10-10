import { Elysia, t } from 'elysia';
import { UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { getDeliveryFeeSvc, updateDeliveryFeeSvc } from './index';

const guards = [
  requireAuth(),
  requireAnyPermissions(
    PermissionKeys.CanDispatchForDelivery,
    PermissionKeys.CanMarkDoorstepCalled,
    PermissionKeys.CanCompleteDoorstepDelivery,
  ),
];
const scope = (parcelId: string, user: AuthUser) => ({
  parcelId,
  companyId: user.companyId ?? '',
  branchId: user.branchId ?? '',
  actorUserId: user.sub,
});
export const deliveryFeeRoutes = new Elysia({ name: 'delivery-fee' })
  .use(authPlugin)
  .get(
    '/dd/:parcelId/fee',
    ({ params, user }) => getDeliveryFeeSvc(scope(params.parcelId, user as AuthUser)),
    {
      params: t.Object({ parcelId: UUID }),
      beforeHandle: guards,
      detail: {
        tags: ['Deliveries'],
        summary: 'Read editable doorstep fee and current payment floor',
      },
    },
  )
  .patch(
    '/dd/:parcelId/fee',
    ({ params, body, user }) =>
      updateDeliveryFeeSvc({
        ...body,
        ...scope(params.parcelId, user as AuthUser),
      }),
    {
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        deliveryFeeCedis: t.Union([t.Number(), t.String()]),
        expectedChargePsw: t.Integer({ minimum: 0 }),
        expectedUpdatedAt: t.String(),
        reason: t.String({ minLength: 3, maxLength: 500 }),
      }),
      beforeHandle: guards,
      detail: {
        tags: ['Deliveries'],
        summary: 'Update a doorstep fee without collecting payment or changing delivery state',
      },
    },
  );
