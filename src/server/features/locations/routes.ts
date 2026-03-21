import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQueryProps, NonEmpty255, UUID } from '@/server/schemas/common';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { getLocationByIdCtrl, listLocationOptionsCtrl, listLocationsCtrl } from './controller';

import { createLocationSvc, deleteLocationSvc, updateLocationSvc } from './service';

export const locationsRoutes = new Elysia({ name: 'locations' })
  .use(authPlugin)
  .get(
    '/options',
    async ({ query }) =>
      listLocationOptionsCtrl({
        companyId: query.companyId ?? null,
        branchId: query.branchId ?? null,
        search: query.search ?? null,
        includeDeleted: query.includeDeleted ?? null,
      }),
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        search: t.Optional(t.String()),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadLocations)],
      detail: {
        tags: ['Locations'],
        summary: 'List location options',
        operationId: 'listLocationOptions',
      },
    },
  )
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
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadLocations)],
      detail: { tags: ['Locations'], summary: 'List locations', operationId: 'listLocations' },
    },
  )
  .get('/:id', async ({ params }) => getLocationByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadLocations)],
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
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateLocations)],
      detail: { tags: ['Locations'], summary: 'Create location', operationId: 'createLocation' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateLocationSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({ name: t.Optional(NonEmpty255) }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateLocations)],
    detail: { tags: ['Locations'], summary: 'Update location', operationId: 'updateLocation' },
  })
  .delete('/:id', async ({ params }) => deleteLocationSvc(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDeleteLocations)],
  });
