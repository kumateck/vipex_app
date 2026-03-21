import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';

import { createStatusSvc, deleteStatusSvc, getStatusSvc, updateStatusSvc } from './service';
import { listStatusOptionsCtrl, listStatusesCtrl } from './controller';
import { PaginationRequestQueryProps, NonEmpty255, UUID } from '@/server/schemas/common';

export const statusesRoutes = new Elysia({ name: 'statuses' })
  .use(authPlugin)
  .get(
    '/options',
    async ({ query }) =>
      listStatusOptionsCtrl({
        companyId: query.companyId ?? null,
        search: query.search ?? null,
        includeDeleted: query.includeDeleted ?? null,
      }),
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        search: t.Optional(t.String()),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadStatuses)],
      detail: { tags: ['Statuses'], summary: 'List status options', operationId: 'listStatusOptions' },
    },
  )
  .get(
    '/',
    async ({ query }) =>
      listStatusesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          includeDeleted: query.includeDeleted ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadStatuses)],
      detail: { tags: ['Statuses'], summary: 'List statuses', operationId: 'listStatuses' },
    },
  )
  .get('/:id', async ({ params }) => getStatusSvc(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadStatuses)],
  })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createStatusSvc(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({ companyId: UUID, name: NonEmpty255, color: NonEmpty255, createdBy: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateStatuses)],
      detail: { tags: ['Statuses'], summary: 'Create status', operationId: 'createStatus' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateStatusSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({ name: t.Optional(NonEmpty255), color: t.Optional(NonEmpty255) }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateStatuses)],
    detail: { tags: ['Statuses'], summary: 'Update status', operationId: 'updateStatus' },
  })
  .delete('/:id', async ({ params }) => deleteStatusSvc(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDeleteStatuses)],
  });
