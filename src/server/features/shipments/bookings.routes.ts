import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQuery, UUID } from '../../schemas/common';
import { createBookingCtrl, getBookingByIdCtrl, listBookingsCtrl } from './bookings.controller';

export const bookingsRoutes = new Elysia({ name: 'bookings' })
  .get(
    '/',
    async ({ query }) =>
      listBookingsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          senderId: query.senderId ?? null,
          sourceId: query.sourceId ?? null,
        },
      }),
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          companyId: t.Optional(UUID),
          senderId: t.Optional(UUID),
          sourceId: t.Optional(UUID),
        }),
      ]),
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
