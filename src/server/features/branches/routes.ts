import { Elysia, t } from 'elysia';

import {
  createBranchSvc,
  deleteBranchSvc,
  getBranchSvc,
  listBranchesSvc,
  updateBranchSvc,
} from './service';
import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import { NonEmpty255, NonEmptyString255, PaginationQuery, UUID } from '@/server/schemas/common';

export const branchesRoutes = new Elysia({ name: 'branches' })
  .get(
    '/',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await listBranchesSvc({
        limit,
        after,
        companyId: query.companyId ?? null,
      });
      return {
        data: data.map((b) => ({
          ...b,
          createdAt: b.createdAt?.toISOString?.() ?? b.createdAt,
          updatedAt: b.updatedAt?.toISOString?.() ?? b.updatedAt,
        })),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: t.Intersect([PaginationQuery, t.Object({ companyId: t.Optional(UUID) })]),
      detail: { tags: ['Branches'], summary: 'List branches', operationId: 'listBranches' },
    },
  )
  .get('/:id', async ({ params }) => getBranchSvc(params.id), { params: t.Object({ id: UUID }) })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createBranchSvc(body);
      set.status = 201;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        name: NonEmptyString255,
        type: NonEmpty255,
        telephone: t.Optional(t.String()),
        address: t.Optional(t.String()),
        email: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: { tags: ['Branches'], summary: 'Create branch', operationId: 'createBranch' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateBranchSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      name: t.Optional(NonEmpty255),
      type: t.Optional(NonEmpty255),
      telephone: t.Optional(t.Union([t.String(), t.Null()])),
      address: t.Optional(t.Union([t.String(), t.Null()])),
      email: t.Optional(t.Union([t.String(), t.Null()])),
    }),
    detail: { tags: ['Branches'], summary: 'Update branch', operationId: 'updateBranch' },
  })
  .delete('/:id', async ({ params }) => deleteBranchSvc(params.id), {
    params: t.Object({ id: UUID }),
  });
