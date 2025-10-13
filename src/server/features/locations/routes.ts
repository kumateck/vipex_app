import { Elysia } from 'elysia';
import { t } from '../../schemas/common';
import { decodeCursor } from '../../utils/cursor';
import {
  CreateLocationBody,
  CreateLocationResponse,
  GetLocationParams,
  ListLocationsQuery,
  ListLocationsResponse,
  LocationDto,
  UpdateLocationBody,
} from './schemas';
import {
  createLocationCtrl,
  deleteLocationCtrl,
  getLocationByIdCtrl,
  listLocationsCtrl,
  updateLocationCtrl,
} from './controller';

export const locationsRoutes = new Elysia({ name: 'locations' })
  .get(
    '/',
    async ({ query }) => {
      const limit = query.limit ? Number(query.limit) : 25;
      const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const res = await listLocationsCtrl({
        limit: safeLimit,
        after,
        companyId: query.companyId ?? null,
        branchId: query.branchId ?? null,
      });
      return res;
    },
    {
      query: ListLocationsQuery,
      response: ListLocationsResponse,
      detail: { tags: ['Locations'], summary: 'List locations', operationId: 'listLocations' },
    },
  )
  .get('/:id', async ({ params }) => getLocationByIdCtrl(params.id), {
    params: GetLocationParams,
    response: LocationDto,
    detail: { tags: ['Locations'], summary: 'Get location by ID', operationId: 'getLocationById' },
  })
  .post(
    '/',
    async ({ body, set }) => {
      const created = await createLocationCtrl(body);
      set.status = 201;
      return created;
    },
    {
      body: CreateLocationBody,
      response: { 201: CreateLocationResponse },
      detail: { tags: ['Locations'], summary: 'Create location', operationId: 'createLocation' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateLocationCtrl(params.id, body), {
    params: GetLocationParams,
    body: UpdateLocationBody,
    response: CreateLocationResponse,
    detail: { tags: ['Locations'], summary: 'Update location', operationId: 'updateLocation' },
  })
  .delete('/:id', async ({ params }) => deleteLocationCtrl(params.id), {
    params: GetLocationParams,
    response: t.Object({ success: t.Boolean() }),
    detail: { tags: ['Locations'], summary: 'Delete location', operationId: 'deleteLocation' },
  });
