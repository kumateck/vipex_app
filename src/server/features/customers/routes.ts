import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQuery, UUID } from '../../schemas/common';
import {
  createCustomerCtrl,
  deleteCustomerCtrl,
  getCustomerByIdCtrl,
  listCustomersCtrl,
  updateCustomerCtrl,
} from './controller';

export const customersRoutes = new Elysia({ name: 'customers' })
  .get(
    '/',
    async ({ query }) =>
      listCustomersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId,
          includeDeleted: query.includeDeleted ?? null,
        },
      }),
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          companyId: UUID,
          includeDeleted: t.Optional(t.Boolean()),
        }),
      ]),
      detail: { tags: ['Customers'], summary: 'List/search customers' },
    },
  )
  .get('/:id', async ({ params }) => getCustomerByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Customers'], summary: 'Get customer' },
  })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createCustomerCtrl(
        body as unknown as {
          companyId: string;
          fullname: string;
          telephone?: string | null;
          telephone2?: string | null;
          address?: string | null;
          email?: string | null;
          createdBy: string;
        },
      );
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.Optional(t.String()),
        telephone2: t.Optional(t.String()),
        address: t.Optional(t.String()),
        email: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: { tags: ['Customers'], summary: 'Create customer' },
    },
  )
  .patch(
    '/:id',
    async ({ params, body }) =>
      updateCustomerCtrl(
        params.id,
        body as unknown as {
          fullname?: string;
          telephone?: string | null;
          telephone2?: string | null;
          address?: string | null;
          email?: string | null;
        },
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        fullname: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        telephone: t.Optional(t.Union([t.String(), t.Null()])),
        telephone2: t.Optional(t.Union([t.String(), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Customers'], summary: 'Update customer' },
    },
  )
  .delete('/:id', async ({ params }) => deleteCustomerCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Customers'], summary: 'Soft delete customer' },
  });
