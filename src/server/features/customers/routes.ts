import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQueryProps, UUID } from '../../schemas/common';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  addCustomerCardCtrl,
  createCustomerCtrl,
  deleteCustomerCtrl,
  findCustomersByTelephoneCtrl,
  getCustomerByIdCtrl,
  listCardOptionsCtrl,
  listCustomerCardsCtrl,
  listCustomersCtrl,
  updateCustomerCtrl,
} from './controller';

export const customersRoutes = new Elysia({ name: 'customers' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCustomersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: user!.companyId!,
          includeDeleted: query.includeDeleted ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: { tags: ['Customers'], summary: 'List/search customers' },
    },
  )
  .get(
    '/lookup/by-telephone/:telephone',
    async ({ params, query, user }) =>
      findCustomersByTelephoneCtrl({
        companyId: (user as AuthUser).companyId ?? '',
        telephone: params.telephone,
        limit: query.limit ?? 10,
      }),
    {
      params: t.Object({ telephone: t.String({ minLength: 1, maxLength: 255 }) }),
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: { tags: ['Customers'], summary: 'Find customers by telephone' },
    },
  )
  .get('/cards/options', async ({ user }) => listCardOptionsCtrl(user!.companyId!), {
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
    detail: { tags: ['Customers'], summary: 'List card type options' },
  })
  .get('/:id', async ({ params, user }) => getCustomerByIdCtrl(params.id, user!.companyId!), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
    detail: { tags: ['Customers'], summary: 'Get customer' },
  })
  .get(
    '/:id/cards',
    async ({ params, user }) =>
      listCustomerCardsCtrl({ customerId: params.id, companyId: user!.companyId! }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: { tags: ['Customers'], summary: 'List customer cards' },
    },
  )
  .post(
    '/:id/cards',
    async ({ params, body, user, set }) => {
      const result = await addCustomerCardCtrl({
        customerId: params.id,
        companyId: user!.companyId!,
        cardId: (body as { cardId: string }).cardId,
        cardNumber: (body as { cardNumber: string }).cardNumber,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        cardId: UUID,
        cardNumber: t.String({ minLength: 1, maxLength: 255 }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Add customer card' },
    },
  )
  .post(
    '/',
    async ({ body, set, user }) => {
      const res = await createCustomerCtrl({
        ...(body as unknown as {
          fullname: string;
          telephone?: string | null;
          telephone2?: string | null;
          address?: string | null;
          email?: string | null;
          isNiaVerified?: boolean;
          loggedToGovernment?: boolean;
        }),
        companyId: user!.companyId!,
        createdBy: user!.sub,
      } as {
        companyId: string;
        fullname: string;
        telephone?: string | null;
        telephone2?: string | null;
        address?: string | null;
        email?: string | null;
        isNiaVerified?: boolean;
        loggedToGovernment?: boolean;
        createdBy: string;
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.Optional(t.String()),
        telephone2: t.Optional(t.String()),
        address: t.Optional(t.String()),
        email: t.Optional(t.String()),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateCustomers)],
      detail: { tags: ['Customers'], summary: 'Create customer' },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) =>
      updateCustomerCtrl(
        params.id,
        user!.companyId!,
        body as unknown as {
          fullname?: string;
          telephone?: string | null;
          telephone2?: string | null;
          address?: string | null;
          email?: string | null;
          isNiaVerified?: boolean;
          loggedToGovernment?: boolean;
        },
        user!.sub,
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        fullname: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        telephone: t.Optional(t.Union([t.String(), t.Null()])),
        telephone2: t.Optional(t.Union([t.String(), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Update customer' },
    },
  )
  .delete(
    '/:id',
    async ({ params, user }) => deleteCustomerCtrl(params.id, user!.companyId!, user!.sub),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDeleteCustomers)],
      detail: { tags: ['Customers'], summary: 'Soft delete customer' },
    },
  );
