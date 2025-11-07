import { Elysia, t } from 'elysia';
import {
  createParcelCtrl,
  getParcelByIdCtrl,
  listParcelsCtrl,
  markParcelReceivedCtrl,
  setPlannedToBePaidCtrl,
  updateParcelCtrl,
} from './parcels.controller';

export const parcelsRoutes = new Elysia({ name: 'parcels' })
  .get(
    '/',
    async ({ query }) =>
      listParcelsCtrl(
        query as {
          limit?: number;
          after?: string | null;
          companyId?: string | null;
          sourceId?: string | null;
          destinationId?: string | null;
          statusId?: string | null;
          search?: string | null;
          received?: boolean | null;
          includeDeleted?: boolean | null;
        },
      ),
    {
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        after: t.Optional(t.String()),
        companyId: t.Optional(t.String({ format: 'uuid' })),
        sourceId: t.Optional(t.String({ format: 'uuid' })),
        destinationId: t.Optional(t.String({ format: 'uuid' })),
        statusId: t.Optional(t.String({ format: 'uuid' })),
        search: t.Optional(t.String()),
        received: t.Optional(t.Boolean()),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Shipments'], summary: 'List/search parcels' },
    },
  )
  .get('/:id', async ({ params }) => getParcelByIdCtrl(params.id), {
    params: t.Object({ id: t.String({ format: 'uuid' }) }),
    detail: { tags: ['Shipments'], summary: 'Get parcel' },
  })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createParcelCtrl(
        body as {
          companyId: string;
          sourceId: string;
          destinationId: string;
          bookingId: string;
          bookingCode: string;
          trackingCode: string;
          senderId: string;
          receiverId: string;
          statusId: string;
          parcelDetails: string;
          parcelContent: string;
          parcelValueCedis?: number | string | null;
          plannedToBePaidCedis?: number | string | null;
          method: number;
          createdBy?: string | null;
          cashierSessionId?: string | null;
        },
      );
      set.status = 201;
      return res;
    },
    {
      body: t.Object({
        companyId: t.String({ format: 'uuid' }),
        sourceId: t.String({ format: 'uuid' }),
        destinationId: t.String({ format: 'uuid' }),
        bookingId: t.String({ format: 'uuid' }),
        bookingCode: t.String(),
        trackingCode: t.String(),
        senderId: t.String({ format: 'uuid' }),
        receiverId: t.String({ format: 'uuid' }),
        statusId: t.String({ format: 'uuid' }),
        parcelDetails: t.String({ minLength: 1, maxLength: 255 }),
        parcelContent: t.String({ minLength: 1, maxLength: 255 }),
        parcelValueCedis: t.Optional(t.Union([t.Number(), t.String()])),
        plannedToBePaidCedis: t.Optional(t.Union([t.Number(), t.String()])),
        method: t.Number(),
        createdBy: t.Optional(t.String({ format: 'uuid' })),
        cashierSessionId: t.Optional(t.String({ format: 'uuid' })),
      }),
      detail: { tags: ['Shipments'], summary: 'Create parcel' },
    },
  )
  .patch(
    '/:id',
    async ({ params, body }) =>
      updateParcelCtrl(
        params.id,
        body as {
          statusId?: string;
          parcelDetails?: string;
          parcelContent?: string;
          parcelValueCedis?: number | string | null;
          pickupLocationId?: string | null;
          method?: number;
          taxReportConfirmation?: boolean;
        },
      ),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        statusId: t.Optional(t.String({ format: 'uuid' })),
        parcelDetails: t.Optional(t.String()),
        parcelContent: t.Optional(t.String()),
        parcelValueCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        pickupLocationId: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
        method: t.Optional(t.Number()),
        taxReportConfirmation: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Shipments'], summary: 'Update parcel' },
    },
  )
  .post(
    '/:id/mark-received',
    async ({ params, body }) =>
      markParcelReceivedCtrl(
        params.id,
        body as { receivedBy: string; receivedAt?: string; statusId?: string },
      ),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        receivedBy: t.String({ format: 'uuid' }),
        receivedAt: t.Optional(t.String({ format: 'date-time' })),
        statusId: t.Optional(t.String({ format: 'uuid' })),
      }),
      detail: { tags: ['Shipments'], summary: 'Mark parcel received' },
    },
  )
  .post(
    '/:id/planned-tobepaid',
    async ({ params, body }) =>
      setPlannedToBePaidCtrl(
        params.id,
        (body as { plannedToBePaidCedis: number | string }).plannedToBePaidCedis,
      ),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ plannedToBePaidCedis: t.Union([t.Number(), t.String()]) }),
      detail: { tags: ['Shipments'], summary: 'Set planned to-be-paid (principal)' },
    },
  );
