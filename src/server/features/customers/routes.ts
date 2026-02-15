import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
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
      listCustomersCtrl(
        query as unknown as {
          companyId: string;
          limit?: number;
          after?: string | null;
          search?: string | null;
          includeDeleted?: boolean | null;
        },
      ),
    {
      query: t.Object({
        companyId: UUID,
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        after: t.Optional(t.String()),
        search: t.Optional(t.String()),
        includeDeleted: t.Optional(t.Boolean()),
      }),
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
