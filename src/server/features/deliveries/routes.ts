import { Elysia, t } from 'elysia';

import {
  createDeliveryCtrl,
  ddAssignCtrl,
  ddCallCtrl,
  ddCompleteCtrl,
  ddOutCtrl,
  markOfficePickupCompleteCtrl,
} from './controller';

export const deliveriesRoutes = new Elysia({ name: 'deliveries' })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createDeliveryCtrl(
        body as {
          parcelId: string;
          mode: number;
          officeLocationId?: string | null;
          dropoffAddress?: string | null;
          chargeCedis?: number | string | null;
          createdBy: string;
          cashierSessionId?: string | null;
        },
      );
      set.status = 201;
      return res;
    },
    {
      body: t.Object({
        parcelId: t.String({ format: 'uuid' }),
        mode: t.Number(),
        officeLocationId: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
        dropoffAddress: t.Optional(t.Union([t.String(), t.Null()])),
        chargeCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        createdBy: t.String({ format: 'uuid' }),
        cashierSessionId: t.Optional(t.String({ format: 'uuid' })),
      }),
      detail: { tags: ['Deliveries'], summary: 'Create delivery order (OFFICE or DOORSTEP)' },
    },
  )
  .post(
    '/office/:parcelId/complete',
    async ({ params, body }) =>
      markOfficePickupCompleteCtrl({
        parcelId: params.parcelId,
        frontDeskUserId: (body as { frontDeskUserId: string }).frontDeskUserId,
        deliveryUserId: (body as { deliveryUserId: string }).deliveryUserId,
      }),
    {
      params: t.Object({ parcelId: t.String({ format: 'uuid' }) }),
      body: t.Object({
        frontDeskUserId: t.String({ format: 'uuid' }),
        deliveryUserId: t.String({ format: 'uuid' }),
      }),
      detail: {
        tags: ['Deliveries'],
        summary: 'Complete OFFICE pickup (requires principal cleared)',
      },
    },
  )
  .post(
    '/dd/:parcelId/call',
    async ({ params, body }) =>
      ddCallCtrl({ parcelId: params.parcelId, userId: (body as { userId: string }).userId }),
    {
      params: t.Object({ parcelId: t.String({ format: 'uuid' }) }),
      body: t.Object({ userId: t.String({ format: 'uuid' }) }),
      detail: { tags: ['Deliveries'], summary: 'Doorstep: mark called' },
    },
  )
  .post(
    '/dd/:parcelId/assign',
    async ({ params, body }) =>
      ddAssignCtrl({
        parcelId: params.parcelId,
        riderUserId: (body as { riderUserId: string }).riderUserId,
      }),
    {
      params: t.Object({ parcelId: t.String({ format: 'uuid' }) }),
      body: t.Object({ riderUserId: t.String({ format: 'uuid' }) }),
      detail: { tags: ['Deliveries'], summary: 'Doorstep: assign rider' },
    },
  )
  .post('/dd/:parcelId/out', async ({ params }) => ddOutCtrl({ parcelId: params.parcelId }), {
    params: t.Object({ parcelId: t.String({ format: 'uuid' }) }),
    detail: { tags: ['Deliveries'], summary: 'Doorstep: out for delivery' },
  })
  .post(
    '/dd/:parcelId/complete',
    async ({ params, body }) =>
      ddCompleteCtrl({
        parcelId: params.parcelId,
        cashierUserId: (body as { cashierUserId: string }).cashierUserId,
        branchId: (body as { branchId: string }).branchId,
        companyId: (body as { companyId: string }).companyId,
        principalAmountCedis: (body as { principalAmountCedis?: number | string | null })
          .principalAmountCedis,
        deliveryFeeAmountCedis: (body as { deliveryFeeAmountCedis?: number | string | null })
          .deliveryFeeAmountCedis,
        method: (body as { method: number }).method,
      }),
    {
      params: t.Object({ parcelId: t.String({ format: 'uuid' }) }),
      body: t.Object({
        cashierUserId: t.String({ format: 'uuid' }),
        branchId: t.String({ format: 'uuid' }),
        companyId: t.String({ format: 'uuid' }),
        principalAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        deliveryFeeAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        method: t.Number(),
      }),
      detail: {
        tags: ['Deliveries'],
        summary: 'Doorstep: complete and optionally collect principal and delivery fee',
      },
    },
  );
