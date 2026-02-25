import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';

import { createStatusSvc, deleteStatusSvc, getStatusSvc, updateStatusSvc } from './service';
import { listStatusesCtrl } from './controller';
import { PaginationRequestQuery, NonEmpty255, UUID } from '@/server/schemas/common';

export const statusesRoutes = new Elysia({ name: 'statuses' })
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
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({ companyId: t.Optional(UUID), includeDeleted: t.Optional(t.Boolean()) }),
      ]),
      detail: { tags: ['Statuses'], summary: 'List statuses', operationId: 'listStatuses' },
    },
  )
  .get('/:id', async ({ params }) => getStatusSvc(params.id), { params: t.Object({ id: UUID }) })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createStatusSvc(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({ companyId: UUID, name: NonEmpty255, color: NonEmpty255, createdBy: UUID }),
      detail: { tags: ['Statuses'], summary: 'Create status', operationId: 'createStatus' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateStatusSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({ name: t.Optional(NonEmpty255), color: t.Optional(NonEmpty255) }),
    detail: { tags: ['Statuses'], summary: 'Update status', operationId: 'updateStatus' },
  })
  .delete('/:id', async ({ params }) => deleteStatusSvc(params.id), {
    params: t.Object({ id: UUID }),
  });
