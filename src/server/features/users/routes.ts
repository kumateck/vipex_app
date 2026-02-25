import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';

import { createUserSvc, getUserSvc, updateUserSvc } from './service';
import { listUserOptionsCtrl, listUsersCtrl } from './controller';
import { PaginationRequestQuery, NonEmpty255, UUID } from '@/server/schemas/common';

export const usersRoutes = new Elysia({ name: 'users' })
  .use(authPlugin)
  .get(
    '/options',
    async ({ query }) =>
      listUserOptionsCtrl({
        companyId: query.companyId ?? null,
        branchId: query.branchId ?? null,
        roleId: query.roleId ?? null,
        status: query.status ?? null,
        search: query.search ?? null,
      }),
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        roleId: t.Optional(UUID),
        status: t.Optional(t.Number()),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadUsers)],
      detail: { tags: ['Users'], summary: 'List user options', operationId: 'listUserOptions' },
    },
  )
  .get(
    '/',
    async ({ query }) =>
      listUsersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          branchId: query.branchId ?? null,
          roleId: query.roleId ?? null,
          status: query.status ?? null,
        },
      }),
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          companyId: t.Optional(UUID),
          branchId: t.Optional(UUID),
          roleId: t.Optional(UUID),
          status: t.Optional(t.Number()),
          search: t.Optional(t.String()),
        }),
      ]),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadUsers)],
      detail: { tags: ['Users'], summary: 'List users', operationId: 'listUsers' },
    },
  )
  .get('/:id', async ({ params }) => getUserSvc(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadUsers)],
    detail: { tags: ['Users'], summary: 'Get user', operationId: 'getUser' },
  })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createUserSvc(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        fullname: NonEmpty255,
        telephone: NonEmpty255,
        email: NonEmpty255,
        status: t.Optional(t.Number()),
        roleId: UUID,
        companyId: UUID,
        branchId: UUID,
        createdBy: UUID,
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateUsers)],
      detail: { tags: ['Users'], summary: 'Create user', operationId: 'createUser' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateUserSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      fullname: t.Optional(NonEmpty255),
      telephone: t.Optional(NonEmpty255),
      email: t.Optional(NonEmpty255),
      status: t.Optional(t.Number()),
      roleId: t.Optional(UUID),
      branchId: t.Optional(UUID),
    }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateUsers)],
    detail: { tags: ['Users'], summary: 'Update user', operationId: 'updateUser' },
  });
