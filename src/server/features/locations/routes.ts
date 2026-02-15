import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import { PaginationQuery, NonEmpty255, UUID } from '@/server/schemas/common';

import {
  createLocationSvc,
  deleteLocationSvc,
  getLocationSvc,
  listLocationsSvc,
  updateLocationSvc,
} from './service';

export const locationsRoutes = new Elysia({ name: 'locations' })
  .get(
    '/',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await listLocationsSvc({
        limit,
        after,
        companyId: query.companyId ?? null,
        branchId: query.branchId ?? null,
        includeDeleted: query.includeDeleted ?? null,
      });
      return {
        data: data.map((l) => ({
          ...l,
          createdAt: l.createdAt?.toISOString?.() ?? l.createdAt,
          updatedAt: l.updatedAt?.toISOString?.() ?? l.updatedAt,
        })),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: t.Intersect([
        PaginationQuery,
        t.Object({
          companyId: t.Optional(UUID),
          branchId: t.Optional(UUID),
          includeDeleted: t.Optional(t.Boolean()),
        }),
      ]),
      detail: { tags: ['Locations'], summary: 'List locations', operationId: 'listLocations' },
    },
  )
  .get('/:id', async ({ params }) => getLocationSvc(params.id), { params: t.Object({ id: UUID }) })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createLocationSvc(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({ companyId: UUID, branchId: UUID, name: NonEmpty255, createdBy: UUID }),
      detail: { tags: ['Locations'], summary: 'Create location', operationId: 'createLocation' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateLocationSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({ name: t.Optional(NonEmpty255) }),
    detail: { tags: ['Locations'], summary: 'Update location', operationId: 'updateLocation' },
  })
  .delete('/:id', async ({ params }) => deleteLocationSvc(params.id), {
    params: t.Object({ id: UUID }),
  });
