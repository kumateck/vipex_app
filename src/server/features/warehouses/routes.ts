import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { PaginationRequestQueryProps, NonEmpty255, UUID } from '@/server/schemas/common';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  createWarehouseCtrl,
  deleteWarehouseCtrl,
  getWarehouseByIdCtrl,
  listWarehouseOptionsCtrl,
  listWarehousesCtrl,
  updateWarehouseCtrl,
} from './controller';

export const warehousesRoutes = new Elysia({ name: 'warehouses' })
  .use(authPlugin)
  .get(
    '/options',
    async ({ query }) =>
      listWarehouseOptionsCtrl({
        companyId: query.companyId ?? null,
        branchId: query.branchId ?? null,
        search: query.search ?? null,
        includeDeleted: query.includeDeleted ?? null,
        activeOnly: query.activeOnly ?? null,
      }),
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        search: t.Optional(t.String()),
        includeDeleted: t.Optional(t.Boolean()),
        activeOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadWarehouses)],
    },
  )
  .get(
    '/',
    async ({ query }) =>
      listWarehousesCtrl({
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
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadWarehouses)],
    },
  )
  .get('/:id', async ({ params }) => getWarehouseByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadWarehouses)],
  })
  .post(
    '/',
    async ({ body, set }) => {
      const result = await createWarehouseCtrl(body);
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        companyId: UUID,
        branchId: UUID,
        name: NonEmpty255,
        description: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
        active: t.Optional(t.Boolean()),
        createdBy: UUID,
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateWarehouses)],
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) => updateWarehouseCtrl(params.id, body, user?.sub ?? null),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        name: t.Optional(NonEmpty255),
        description: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
        active: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateWarehouses)],
    },
  )
  .delete('/:id', async ({ params, user }) => deleteWarehouseCtrl(params.id, user?.sub ?? null), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDeleteWarehouses)],
  });
