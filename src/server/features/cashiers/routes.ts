import { Elysia, t } from 'elysia';
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
      set.status = 201;
      return res;
    },
    {
      body: t.Object({
        sessionType: t.String({ minLength: 1, maxLength: 50 }),
        startTime: t.String({ minLength: 4, maxLength: 5 }), // "08:00"
        endTime: t.String({ minLength: 4, maxLength: 5 }),
        createdBy: t.String({ format: 'uuid' }),
      }),
      detail: { tags: ['Cashiers'], summary: 'Create session type' },
    },
  )
  .get(
    '/sessions',
    async ({ query }) =>
      listSessionsCtrl(
        query as {
          limit?: number;
          after?: string | null;
          cashierId?: string | null;
          branchId?: string | null;
          activeOnly?: boolean | null;
        },
      ),
    {
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        after: t.Optional(t.String()),
        cashierId: t.Optional(t.String({ format: 'uuid' })),
        branchId: t.Optional(t.String({ format: 'uuid' })),
        activeOnly: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Cashiers'], summary: 'List cashier sessions' },
    },
  )
  .get('/sessions/:id', async ({ params }) => getSessionByIdCtrl(params.id), {
    params: t.Object({ id: t.String({ format: 'uuid' }) }),
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
      set.status = 201;
      return res;
    },
    {
      body: t.Object({
        cashierId: t.String({ format: 'uuid' }),
        branchId: t.String({ format: 'uuid' }),
        sessionTypeId: t.String({ format: 'uuid' }),
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
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        endTime: t.String({ format: 'date-time' }),
        closingBalanceCedis: t.Optional(t.Union([t.Number(), t.String()])),
      }),
      detail: { tags: ['Cashiers'], summary: 'Close cashier session' },
    },
  );
