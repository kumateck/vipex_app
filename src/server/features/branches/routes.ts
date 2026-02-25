import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';

import { createBranchSvc, deleteBranchSvc, getBranchSvc, updateBranchSvc } from './service';
import { listBranchesCtrl } from './controller';
import {
  NonEmpty255,
  NonEmptyString255,
  PaginationRequestQuery,
  UUID,
} from '@/server/schemas/common';

export const branchesRoutes = new Elysia({ name: 'branches' })
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
      detail: { tags: ['Branches'], summary: 'List branches', operationId: 'listBranches' },
    },
  )
  .get('/:id', async ({ params }) => getBranchSvc(params.id), { params: t.Object({ id: UUID }) })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createBranchSvc(body);
      set.status = HttpStatus.CREATED;
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
