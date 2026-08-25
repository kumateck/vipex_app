import { Elysia, t } from 'elysia';
import { UUID } from '../../schemas/common';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  cancelSelfServiceDraftCtrl,
  claimSelfServiceDraftCtrl,
  completeSelfServiceDraftCtrl,
  getSelfServiceDraftCtrl,
  listSelfServiceDraftsCtrl,
} from './agent.controller';

export const selfServiceAgentRoutes = new Elysia({ name: 'self-service-agent' })
  .use(authPlugin)
  .get('/drafts', async ({ user }) => listSelfServiceDraftsCtrl(user!), {
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadSelfServiceBookings)],
    detail: { tags: ['Self-Service'], summary: 'List self-service drafts for my branch' },
  })
  .get('/drafts/:id', async ({ params, user }) => getSelfServiceDraftCtrl(params.id, user!), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadSelfServiceBookings)],
    detail: { tags: ['Self-Service'], summary: 'Get a self-service draft' },
  })
  .post(
    '/drafts/:id/claim',
    async ({ params, user }) => claimSelfServiceDraftCtrl(params.id, user!),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCompleteSelfServiceBookings),
      ],
      detail: { tags: ['Self-Service'], summary: 'Claim a self-service draft' },
    },
  )
  .post(
    '/drafts/:id/complete',
    async ({ params, body, user }) => completeSelfServiceDraftCtrl(params.id, body, user!),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        destinationId: UUID,
        pickupLocationId: t.Optional(t.Union([UUID, t.Null()])),
        parcelDetails: t.String({ minLength: 1, maxLength: 255 }),
        chargeCedis: t.Union([t.Number({ minimum: 0 }), t.String()]),
        paymentResponsibility: t.Union([
          t.Literal('SENDER'),
          t.Literal('RECEIVER'),
          t.Literal('SPLIT'),
        ]),
        senderSettlementMode: t.Union([t.Literal('PAY_NOW'), t.Literal('CREDIT')]),
        senderPartialPaymentCedis: t.Optional(
          t.Union([t.Number({ minimum: 0 }), t.String(), t.Null()]),
        ),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCompleteSelfServiceBookings),
      ],
      detail: {
        tags: ['Self-Service'],
        summary: 'Complete a self-service draft into a real booking',
      },
    },
  )
  .post(
    '/drafts/:id/cancel',
    async ({ params, body, user }) => cancelSelfServiceDraftCtrl(params.id, body.reason, user!),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ reason: t.String({ minLength: 1, maxLength: 1000 }) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCompleteSelfServiceBookings),
      ],
      detail: { tags: ['Self-Service'], summary: 'Cancel a self-service draft' },
    },
  );
