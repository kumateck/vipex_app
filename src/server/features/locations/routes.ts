import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQuery, NonEmpty255, UUID } from '@/server/schemas/common';
import { getLocationByIdCtrl, listLocationsCtrl } from './controller';

import { createLocationSvc, deleteLocationSvc, updateLocationSvc } from './service';

export const locationsRoutes = new Elysia({ name: 'locations' })
  .get(
    '/',
    async ({ query }) =>
      listLocationsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          branchId: query.branchId ?? null,
          includeDeleted: query.includeDeleted ?? null,
        },
      }),
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          companyId: t.Optional(UUID),
          branchId: t.Optional(UUID),
          includeDeleted: t.Optional(t.Boolean()),
        }),
      ]),
      detail: { tags: ['Locations'], summary: 'List locations', operationId: 'listLocations' },
    },
  )
  .get('/:id', async ({ params }) => getLocationByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
  })
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
