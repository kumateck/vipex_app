import { Elysia, t } from 'elysia';

import {
  createStatusSvc,
  deleteStatusSvc,
  getStatusSvc,
  listStatusesSvc,
  updateStatusSvc,
} from './service';
import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import { PaginationQuery, NonEmpty255, UUID } from '@/server/schemas/common';

export const statusesRoutes = new Elysia({ name: 'statuses' })
  .get(
    '/',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await listStatusesSvc({
        limit,
        after,
        companyId: query.companyId ?? null,
        includeDeleted: query.includeDeleted ?? null,
      });
      return {
        data: data.map((s) => ({
          ...s,
          createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
          updatedAt: s.updatedAt?.toISOString?.() ?? s.updatedAt,
        })),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: t.Intersect([
        PaginationQuery,
        t.Object({ companyId: t.Optional(UUID), includeDeleted: t.Optional(t.Boolean()) }),
      ]),
      detail: { tags: ['Statuses'], summary: 'List statuses', operationId: 'listStatuses' },
    },
  )
  .get('/:id', async ({ params }) => getStatusSvc(params.id), { params: t.Object({ id: UUID }) })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createStatusSvc(body);
      set.status = 201;
      return res;
    },
    {
      body: t.Object({ companyId: UUID, name: NonEmpty255, color: NonEmpty255, createdBy: UUID }),
      detail: { tags: ['Statuses'], summary: 'Create status', operationId: 'createStatus' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateStatusSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({ name: t.Optional(NonEmpty255), color: t.Optional(NonEmpty255) }),
    detail: { tags: ['Statuses'], summary: 'Update status', operationId: 'updateStatus' },
  })
  .delete('/:id', async ({ params }) => deleteStatusSvc(params.id), {
    params: t.Object({ id: UUID }),
  });
