import { Elysia, t } from 'elysia';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import {
  decideDeliveryChangeSvc,
  listBranchPendingDeliveryChangesSvc,
  listRiderPendingDeliveryChangesSvc,
  requestDeliveryChangeSvc,
} from './delivery-change-request.service';

export const deliveryChangeRequestRoutes = new Elysia({ name: 'delivery-change-requests' })
  .use(authPlugin)
  .post(
    '/dd/:parcelId/change-request',
    ({ params, body, user }) =>
      requestDeliveryChangeSvc({
        parcelId: params.parcelId,
        riderUserId: (user as AuthUser).sub,
        requestedDropoffAddress: body.requestedDropoffAddress,
        requestedDeliveryFeeCedis: body.requestedDeliveryFeeCedis,
        reason: body.reason,
      }),
    {
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        requestedDropoffAddress: t.String({ minLength: 3, maxLength: 255 }),
        requestedDeliveryFeeCedis: t.Union([t.Number(), t.String()]),
        reason: t.String({ minLength: 3, maxLength: 500 }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCompleteDoorstepDelivery)],
      detail: { tags: ['Deliveries'], summary: 'Rider requests delivery address and fee change' },
    },
  )
  .get(
    '/dd/change-requests/mine',
    ({ user }) => listRiderPendingDeliveryChangesSvc((user as AuthUser).sub),
    {
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadRiderCurrentParcels,
          PermissionKeys.CanCompleteDoorstepDelivery,
        ),
      ],
      detail: { tags: ['Deliveries'], summary: 'List current rider delivery change requests' },
    },
  )
  .get(
    '/dd/change-requests/pending',
    ({ user }) => listBranchPendingDeliveryChangesSvc((user as AuthUser).branchId ?? ''),
    {
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanMarkDoorstepCalled)],
      detail: { tags: ['Deliveries'], summary: 'List branch delivery change requests' },
    },
  )
  .post(
    '/dd/change-requests/:deliveryId/decision',
    ({ params, body, user }) => {
      const actor = user as AuthUser;
      return decideDeliveryChangeSvc({
        deliveryId: params.deliveryId,
        branchId: actor.branchId ?? '',
        reviewerUserId: actor.sub,
        decision: body.decision,
        reviewNote: body.reviewNote,
      });
    },
    {
      params: t.Object({ deliveryId: UUID }),
      body: t.Object({
        decision: t.Union([t.Literal('APPROVED'), t.Literal('REJECTED')]),
        reviewNote: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanMarkDoorstepCalled)],
      detail: { tags: ['Deliveries'], summary: 'Approve or reject a delivery change request' },
    },
  );
