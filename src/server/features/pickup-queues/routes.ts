import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  createPickupQueueCtrl,
  getPickupQueueByParcelCtrl,
  listActivePickupQueueCardsForBranchCtrl,
  listActivePickupQueuesForBranchCtrl,
} from './controller';

export const pickupQueuesRoutes = new Elysia({ name: 'pickup-queues' })
  .use(authPlugin)
  .get(
    '/branch/:branchId/active',
    async ({ params }) => listActivePickupQueuesForBranchCtrl(params.branchId),
    {
      params: t.Object({ branchId: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
      detail: { tags: ['Pickup Queues'], summary: 'List active pickup queues for a branch' },
    },
  )
  .get(
    '/branch/:branchId/cards',
    async ({ params, query }) =>
      listActivePickupQueueCardsForBranchCtrl({
        branchId: params.branchId,
        paymentBucket: (query.paymentBucket as 'SP' | 'TP' | undefined) ?? null,
      }),
    {
      params: t.Object({ branchId: UUID }),
      query: t.Object({
        paymentBucket: t.Optional(t.Union([t.Literal('SP'), t.Literal('TP')])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
      detail: { tags: ['Pickup Queues'], summary: 'List active pickup queue cards for a branch' },
    },
  )
  .get('/parcel/:parcelId', async ({ params }) => getPickupQueueByParcelCtrl(params.parcelId), {
    params: t.Object({ parcelId: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
    detail: { tags: ['Pickup Queues'], summary: 'Get pickup queue by parcel' },
  })
  .post(
    '/',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return createPickupQueueCtrl({
        ...(body as {
          parcelId: string;
          pickerStaffId?: string | null;
          idCardTypeId?: string | null;
          idCardNumber?: string | null;
          sendSms?: boolean;
        }),
        queuedBy: authUser.sub,
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        pickerStaffId: t.Optional(t.Union([UUID, t.Null()])),
        idCardTypeId: t.Optional(t.Union([UUID, t.Null()])),
        idCardNumber: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        sendSms: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreatePickupQueue)],
      detail: { tags: ['Pickup Queues'], summary: 'Create pickup queue ticket for a parcel' },
    },
  );
