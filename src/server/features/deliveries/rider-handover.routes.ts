import { Elysia, t } from 'elysia';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { ddReturnToOfficeCtrl, ddRiderGivenCtrl } from './controller';

export const riderHandoverRoutes = new Elysia({ name: 'rider-handover' })
  .use(authPlugin)
  .post(
    '/dd/:parcelId/rider-given',
    async ({ params, body, user }) => {
      const actor = user as AuthUser;
      return ddRiderGivenCtrl({
        parcelId: params.parcelId,
        riderUserId: actor.sub,
        signatureImage: body.signatureImage,
        principalAmountCedis: body.principalAmountCedis,
        deliveryFeeAmountCedis: body.deliveryFeeAmountCedis,
        secondReceiverId: body.secondReceiverId,
        cardId: body.cardId,
        cardNumber: body.cardNumber,
        secondCardId: body.secondCardId,
        secondCardNumber: body.secondCardNumber,
      });
    },
    {
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        riderUserId: UUID,
        signatureImage: t.String({ minLength: 10 }),
        principalAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        deliveryFeeAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        secondReceiverId: t.Optional(t.Union([UUID, t.Null()])),
        cardId: t.Optional(t.Union([UUID, t.Null()])),
        cardNumber: t.Optional(t.Union([t.String(), t.Null()])),
        secondCardId: t.Optional(t.Union([UUID, t.Null()])),
        secondCardNumber: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCompleteDoorstepDelivery)],
      detail: { tags: ['Deliveries'], summary: 'Rider confirms signed handover and collection' },
    },
  )
  .post(
    '/dd/:parcelId/returned',
    async ({ params, user }) =>
      ddReturnToOfficeCtrl({ parcelId: params.parcelId, riderUserId: (user as AuthUser).sub }),
    {
      params: t.Object({ parcelId: UUID }),
      body: t.Object({ riderUserId: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCompleteDoorstepDelivery)],
      detail: { tags: ['Deliveries'], summary: 'Rider returns parcel to office' },
    },
  );
