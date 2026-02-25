import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQuery, UUID } from '../../schemas/common';
import {
  closeSessionCtrl,
  createSessionTypeCtrl,
  getSessionByIdCtrl,
  listSessionTypesCtrl,
  listSessionsCtrl,
  openSessionCtrl,
} from './controller';

export const cashiersRoutes = new Elysia({ name: 'cashiers' })
  .get('/session-types', async () => listSessionTypesCtrl(), {
    detail: { tags: ['Cashiers'], summary: 'List cashier session types' },
  })
  .post(
    '/session-types',
    async ({ body, set }) => {
      const res = await createSessionTypeCtrl(
        body as { sessionType: string; startTime: string; endTime: string; createdBy: string },
      );
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        sessionType: t.String({ minLength: 1, maxLength: 50 }),
        startTime: t.String({ minLength: 4, maxLength: 5 }), // "08:00"
        endTime: t.String({ minLength: 4, maxLength: 5 }),
        createdBy: UUID,
      }),
      detail: { tags: ['Cashiers'], summary: 'Create session type' },
    },
  )
  .get(
    '/sessions',
    async ({ query }) =>
      listSessionsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          cashierId: query.cashierId ?? null,
          branchId: query.branchId ?? null,
          activeOnly: query.activeOnly ?? null,
        },
      }),
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          cashierId: t.Optional(UUID),
          branchId: t.Optional(UUID),
          activeOnly: t.Optional(t.Boolean()),
        }),
      ]),
      detail: { tags: ['Cashiers'], summary: 'List cashier sessions' },
    },
  )
  .get('/sessions/:id', async ({ params }) => getSessionByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Cashiers'], summary: 'Get session' },
  })
  .post(
    '/sessions',
    async ({ body, set }) => {
      const res = await openSessionCtrl(
        body as {
          cashierId: string;
          branchId: string;
          sessionTypeId: string;
          startTime: string;
          openingBalanceCedis?: number | string | null;
        },
      );
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        cashierId: UUID,
        branchId: UUID,
        sessionTypeId: UUID,
        startTime: t.String({ format: 'date-time' }),
        openingBalanceCedis: t.Optional(t.Union([t.Number(), t.String()])),
      }),
      detail: { tags: ['Cashiers'], summary: 'Open cashier session' },
    },
  )
  .post(
    '/sessions/:id/close',
    async ({ params, body }) =>
      closeSessionCtrl(
        params.id,
        body as { endTime: string; closingBalanceCedis?: number | string | null },
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        endTime: t.String({ format: 'date-time' }),
        closingBalanceCedis: t.Optional(t.Union([t.Number(), t.String()])),
      }),
      detail: { tags: ['Cashiers'], summary: 'Close cashier session' },
    },
  );
