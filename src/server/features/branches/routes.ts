import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';

import { createBranchSvc, deleteBranchSvc, getBranchSvc, updateBranchSvc } from './service';
import { listBranchOptionsCtrl, listBranchesCtrl } from './controller';
import {
  NonEmpty255,
  NonEmptyString255,
  PaginationRequestQuery,
  UUID,
} from '@/server/schemas/common';

export const branchesRoutes = new Elysia({ name: 'branches' })
  .use(authPlugin)
  .get(
    '/options',
    async ({ query }) =>
      listBranchOptionsCtrl({
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
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadBranches)],
      detail: { tags: ['Branches'], summary: 'List branch options', operationId: 'listBranchOptions' },
    },
  )
  .get(
    '/',
    async ({ query }) =>
      listBranchesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: { companyId: query.companyId ?? null },
      }),
    {
      query: t.Intersect([PaginationRequestQuery, t.Object({ companyId: t.Optional(UUID) })]),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadBranches)],
      detail: { tags: ['Branches'], summary: 'List branches', operationId: 'listBranches' },
    },
  )
  .get('/:id', async ({ params }) => getBranchSvc(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadBranches)],
  })
  .post(
    '/',
    async ({ body, set, user }) => {
      const authUser = user as AuthUser;
      const res = await createBranchSvc({
        ...(body as {
          name: string;
          type: string;
          telephone?: string;
          address?: string;
          email?: string;
        }),
        companyId: authUser.companyId ?? '',
        createdBy: authUser.sub,
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        name: NonEmptyString255,
        type: NonEmpty255,
        telephone: t.Optional(t.String()),
        address: t.Optional(t.String()),
        email: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateBranches)],
      detail: { tags: ['Branches'], summary: 'Create branch', operationId: 'createBranch' },
    },
  )
  .patch('/:id', async ({ params, body, user }) => updateBranchSvc(params.id, body, (user as AuthUser).sub), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      name: t.Optional(NonEmpty255),
      type: t.Optional(NonEmpty255),
      telephone: t.Optional(t.Union([t.String(), t.Null()])),
      address: t.Optional(t.Union([t.String(), t.Null()])),
      email: t.Optional(t.Union([t.String(), t.Null()])),
    }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateBranches)],
    detail: { tags: ['Branches'], summary: 'Update branch', operationId: 'updateBranch' },
  })
  .delete('/:id', async ({ params, user }) => deleteBranchSvc(params.id, (user as AuthUser).sub), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDeleteBranches)],
  });
