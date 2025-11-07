import { Elysia, t } from 'elysia';
import { createBookingCtrl, getBookingByIdCtrl, listBookingsCtrl } from './bookings.controller';

export const bookingsRoutes = new Elysia({ name: 'bookings' })
  .get(
    '/',
    async ({ query }) =>
      listBookingsCtrl(
        query as {
          limit?: number;
          after?: string | null;
          companyId?: string | null;
          senderId?: string | null;
          sourceId?: string | null;
        },
      ),
    {
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        after: t.Optional(t.String()),
        companyId: t.Optional(t.String({ format: 'uuid' })),
        senderId: t.Optional(t.String({ format: 'uuid' })),
        sourceId: t.Optional(t.String({ format: 'uuid' })),
      }),
      detail: { tags: ['Shipments'], summary: 'List bookings' },
    },
  )
  .get('/:id', async ({ params }) => getBookingByIdCtrl(params.id), {
    params: t.Object({ id: t.String({ format: 'uuid' }) }),
    detail: { tags: ['Shipments'], summary: 'Get booking' },
  })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createBookingCtrl(
        body as {
          senderId: string;
          companyId: string;
          sourceId: string;
          statusId: string;
          createdBy: string;
          cashierSessionId?: string | null;
        },
      );
      set.status = 201;
      return res;
    },
    {
      body: t.Object({
        senderId: t.String({ format: 'uuid' }),
        companyId: t.String({ format: 'uuid' }),
        sourceId: t.String({ format: 'uuid' }),
        statusId: t.String({ format: 'uuid' }),
        createdBy: t.String({ format: 'uuid' }),
        cashierSessionId: t.Optional(t.String({ format: 'uuid' })),
      }),
      detail: { tags: ['Shipments'], summary: 'Create booking' },
    },
  );
