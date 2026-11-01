import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../../utils/http-status';
import { PaginationRequestQueryProps, UUID } from '../../../schemas/common';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  addCustomerCardCtrl,
  findCustomersByTelephoneCtrl,
  getCustomerTransactionsMonthlyCtrl,
  listCardOptionsCtrl,
  listCustomerCardsCtrl,
  listCustomerTransactionsCtrl,
  listCustomersCtrl,
  updateCustomerCardCtrl,
} from '../controller';
import { findOrCreateCustomerSvc } from '../service';

export const customersRoutes1 = new Elysia({ name: 'customers-1' })
  .use(authPlugin)

  .post(
    '/resolve-second-receiver',
    ({ body, user }) => {
      const authUser = user as AuthUser;
      return findOrCreateCustomerSvc({
        companyId: authUser.companyId ?? '',
        fullname: body.fullname,
        telephone: body.telephone,
        createdBy: authUser.sub,
      });
    },
    {
      body: t.Object({
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.String({ minLength: 10, maxLength: 20 }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateCustomers)],
      detail: { tags: ['Customers'], summary: 'Resolve or create a second receiver by telephone' },
    },
  )

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
          customerType: query.customerType,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        includeDeleted: t.Optional(t.Boolean()),
        customerType: t.Optional(t.Integer({ minimum: 0, maximum: 5 })),
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

  .get(
    '/lookup/booking-by-telephone/:telephone',
    async ({ params, user }) => {
      const rows = await findCustomersByTelephoneCtrl({
        companyId: (user as AuthUser).companyId ?? '',
        telephone: params.telephone,
        limit: 10,
      });
      return rows.map(({ id, fullname, telephone, telephone2, customerType }) => ({
        id,
        fullname,
        telephone,
        telephone2,
        customerType,
      }));
    },
    {
      params: t.Object({ telephone: t.String({ pattern: '^\\d{10}$' }) }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateBookingWithParcels)],
      detail: { tags: ['Customers'], summary: 'Find customer for parcel booking by telephone' },
    },
  )

  .get('/cards/options', async ({ user }) => listCardOptionsCtrl(user!.companyId!), {
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
    detail: { tags: ['Customers'], summary: 'List card type options' },
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
        frontImageUrl: (body as { frontImageUrl?: string | null }).frontImageUrl ?? null,
        backImageUrl: (body as { backImageUrl?: string | null }).backImageUrl ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        cardId: UUID,
        cardNumber: t.String({ minLength: 1, maxLength: 255 }),
        frontImageUrl: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        backImageUrl: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Add customer card' },
    },
  )

  .patch(
    '/:id/cards/:cardRecordId',
    async ({ params, body, user }) =>
      updateCustomerCardCtrl({
        id: params.cardRecordId,
        customerId: params.id,
        companyId: user!.companyId!,
        cardId: body.cardId,
        cardNumber: body.cardNumber,
        frontImageUrl: body.frontImageUrl,
        backImageUrl: body.backImageUrl,
      }),
    {
      params: t.Object({ id: UUID, cardRecordId: UUID }),
      body: t.Object({
        cardId: t.Optional(UUID),
        cardNumber: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        frontImageUrl: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        backImageUrl: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Update customer card' },
    },
  )

  .get(
    '/:id/transactions/monthly',
    async ({ params, query, user }) =>
      getCustomerTransactionsMonthlyCtrl({
        customerId: params.id,
        companyId: user!.companyId!,
        year: query.year,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        year: t.Optional(t.Number({ minimum: 2000, maximum: 2100 })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: {
        tags: ['Customers'],
        summary: 'Get customer monthly sending/invoiced summary for a year',
      },
    },
  )

  .get(
    '/:id/transactions',
    async ({ params, query, user }) =>
      listCustomerTransactionsCtrl({
        customerId: params.id,
        companyId: user!.companyId!,
        page: query.page,
        pageSize: query.pageSize,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: { tags: ['Customers'], summary: 'List customer sending transactions' },
    },
  );
