import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';

import {
  createDeliveryCtrl,
  ddAddressCollectedCtrl,
  ddAssignCtrl,
  ddCallCtrl,
  ddCompleteCtrl,
  ddDispatchBulkCtrl,
  ddFinalizeAtOfficeCtrl,
  ddListByRiderCtrl,
  ddOutCtrl,
  ddReturnToOfficeCtrl,
  ddRiderGivenCtrl,
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
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        parcelId: UUID,
        mode: t.Number(),
        officeLocationId: t.Optional(t.Union([UUID, t.Null()])),
        dropoffAddress: t.Optional(t.Union([t.String(), t.Null()])),
        chargeCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        createdBy: UUID,
        cashierSessionId: t.Optional(UUID),
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
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        frontDeskUserId: UUID,
        deliveryUserId: UUID,
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
      params: t.Object({ parcelId: UUID }),
      body: t.Object({ userId: UUID }),
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
      params: t.Object({ parcelId: UUID }),
      body: t.Object({ riderUserId: UUID }),
      detail: { tags: ['Deliveries'], summary: 'Doorstep: assign rider' },
    },
  )
  .post('/dd/:parcelId/out', async ({ params }) => ddOutCtrl({ parcelId: params.parcelId }), {
    params: t.Object({ parcelId: UUID }),
    detail: { tags: ['Deliveries'], summary: 'Doorstep: out for delivery' },
  })
  .post(
    '/dd/:parcelId/address-collected',
    async ({ params, body }) =>
      ddAddressCollectedCtrl({
        parcelId: params.parcelId,
        userId: (body as { userId: string }).userId,
        dropoffAddress: (body as { dropoffAddress: string }).dropoffAddress,
        deliveryFeeCedis: (body as { deliveryFeeCedis: number | string }).deliveryFeeCedis,
      }),
    {
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        userId: UUID,
        dropoffAddress: t.String({ minLength: 3, maxLength: 255 }),
        deliveryFeeCedis: t.Union([t.Number(), t.String()]),
      }),
      detail: { tags: ['Deliveries'], summary: 'Doorstep: collect address and delivery fee' },
    },
  )
  .post(
    '/dd/dispatch/bulk',
    async ({ body }) =>
      ddDispatchBulkCtrl({
        parcelIds: (body as { parcelIds: string[] }).parcelIds,
        riderUserId: (body as { riderUserId: string }).riderUserId,
        userId: (body as { userId: string }).userId,
      }),
    {
      body: t.Object({
        parcelIds: t.Array(UUID, { minItems: 1 }),
        riderUserId: UUID,
        userId: UUID,
      }),
      detail: { tags: ['Deliveries'], summary: 'Doorstep: dispatch/reassign parcels in bulk' },
    },
  )
  .get(
    '/dd/rider/:riderUserId',
    async ({ params, query }) =>
      ddListByRiderCtrl({
        riderUserId: params.riderUserId,
        mode: (query.mode ?? 'current') as 'current' | 'history',
      }),
    {
      params: t.Object({ riderUserId: UUID }),
      query: t.Object({
        mode: t.Optional(t.Union([t.Literal('current'), t.Literal('history')])),
      }),
      detail: { tags: ['Deliveries'], summary: 'Doorstep: list rider assigned/current/history' },
    },
  )
  .post(
    '/dd/:parcelId/rider-given',
    async ({ params, body }) =>
      ddRiderGivenCtrl({
        parcelId: params.parcelId,
        riderUserId: (body as { riderUserId: string }).riderUserId,
        signatureImage: (body as { signatureImage: string }).signatureImage,
        secondReceiverId: (body as { secondReceiverId?: string | null }).secondReceiverId,
        cardId: (body as { cardId?: string | null }).cardId,
        cardNumber: (body as { cardNumber?: string | null }).cardNumber,
        secondCardId: (body as { secondCardId?: string | null }).secondCardId,
        secondCardNumber: (body as { secondCardNumber?: string | null }).secondCardNumber,
      }),
    {
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        riderUserId: UUID,
        signatureImage: t.String({ minLength: 10 }),
        secondReceiverId: t.Optional(t.Union([UUID, t.Null()])),
        cardId: t.Optional(t.Union([UUID, t.Null()])),
        cardNumber: t.Optional(t.Union([t.String(), t.Null()])),
        secondCardId: t.Optional(t.Union([UUID, t.Null()])),
        secondCardNumber: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Deliveries'], summary: 'Doorstep: rider confirms handover with signature' },
    },
  )
  .post(
    '/dd/:parcelId/returned',
    async ({ params, body }) =>
      ddReturnToOfficeCtrl({
        parcelId: params.parcelId,
        riderUserId: (body as { riderUserId: string }).riderUserId,
      }),
    {
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        riderUserId: UUID,
      }),
      detail: { tags: ['Deliveries'], summary: 'Doorstep: rider returns parcel to office' },
    },
  )
  .post(
    '/dd/:parcelId/finalize-at-office',
    async ({ params, body }) =>
      ddFinalizeAtOfficeCtrl({
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
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        cashierUserId: UUID,
        branchId: UUID,
        companyId: UUID,
        principalAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        deliveryFeeAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        method: t.Number(),
      }),
      detail: {
        tags: ['Deliveries'],
        summary: 'Doorstep: cashier finalization after rider return',
      },
    },
  )
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
      params: t.Object({ parcelId: UUID }),
      body: t.Object({
        cashierUserId: UUID,
        branchId: UUID,
        companyId: UUID,
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
