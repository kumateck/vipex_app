import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
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
        companyId: t.Optional(UUID),
        senderId: t.Optional(UUID),
        sourceId: t.Optional(UUID),
      }),
      detail: { tags: ['Shipments'], summary: 'List bookings' },
    },
  )
  .get('/:id', async ({ params }) => getBookingByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
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
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        senderId: UUID,
        companyId: UUID,
        sourceId: UUID,
        statusId: UUID,
        createdBy: UUID,
        cashierSessionId: t.Optional(UUID),
      }),
      detail: { tags: ['Shipments'], summary: 'Create booking' },
    },
  );
