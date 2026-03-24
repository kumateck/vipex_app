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
  getCustomerPaymentsMonthlyCtrl,
  getCustomerTransactionsMonthlyCtrl,
  listCustomerCreditOpenItemsCtrl,
  getCustomerCreditSummaryCtrl,
  listCustomerPaymentsCtrl,
  getCustomerStatementCtrl,
  listCardOptionsCtrl,
  listCustomerCardsCtrl,
  listCustomerCreditTransactionsCtrl,
  listCustomerTransactionsCtrl,
  listCustomersCtrl,
  postCustomerCreditPaymentCtrl,
  updateCustomerCtrl,
  updateCustomerCardCtrl,
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
  )
  .get(
    '/:id/payments/monthly',
    async ({ params, query, user }) =>
      getCustomerPaymentsMonthlyCtrl({
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
      detail: { tags: ['Customers'], summary: 'Get customer monthly payments summary for a year' },
    },
  )
  .get(
    '/:id/payments',
    async ({ params, query, user }) =>
      listCustomerPaymentsCtrl({
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
      detail: { tags: ['Customers'], summary: 'List customer payments' },
    },
  )
  .get(
    '/:id/statement',
    async ({ params, query, user }) =>
      getCustomerStatementCtrl({
        customerId: params.id,
        companyId: user!.companyId!,
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: { tags: ['Customers'], summary: 'Get customer statement by date range' },
    },
  )
  .get(
    '/:id/credit/open-items',
    async ({ params, query, user }) =>
      listCustomerCreditOpenItemsCtrl({
        customerId: params.id,
        companyId: user!.companyId!,
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: { tags: ['Customers'], summary: 'List customer open credit items' },
    },
  )
  .get(
    '/:id/credit/summary',
    async ({ params, user }) =>
      getCustomerCreditSummaryCtrl({ customerId: params.id, companyId: user!.companyId! }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: { tags: ['Customers'], summary: 'Get customer credit summary' },
    },
  )
  .get(
    '/:id/credit/transactions',
    async ({ params, query, user }) =>
      listCustomerCreditTransactionsCtrl({
        customerId: params.id,
        companyId: user!.companyId!,
        limit: query.limit,
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({
        limit: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: { tags: ['Customers'], summary: 'List customer credit transactions' },
    },
  )
  .post(
    '/:id/credit/payments',
    async ({ params, body, user, set }) => {
      const result = await postCustomerCreditPaymentCtrl({
        customerId: params.id,
        companyId: user!.companyId!,
        amountCedis: (body as { amountCedis: number | string }).amountCedis,
        notes: (body as { notes?: string | null }).notes,
        referenceId: (body as { referenceId?: string | null }).referenceId,
        createdBy: user!.sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        amountCedis: t.Union([t.Number(), t.String()]),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        referenceId: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Record customer credit payment' },
    },
  )
  .get('/:id', async ({ params, user }) => getCustomerByIdCtrl(params.id, user!.companyId!), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
    detail: { tags: ['Customers'], summary: 'Get customer' },
  })
  .post(
    '/crm',
    async ({ body, set, user }) => {
      const payload = body as {
        fullname: string;
        telephone?: string | null;
        telephone2?: string | null;
        address?: string | null;
        email?: string | null;
        customerType?: number;
        creditEligible?: boolean;
        creditLimitPsw?: number;
        paymentTermsDays?: number;
        isNiaVerified?: boolean;
        loggedToGovernment?: boolean;
      };

      const res = await createCustomerCtrl({
        ...payload,
        sourceContext: 'crm',
        companyId: user!.companyId!,
        createdBy: user!.sub,
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.Optional(t.Union([t.String(), t.Null()])),
        telephone2: t.Optional(t.Union([t.String(), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        customerType: t.Optional(t.Number()),
        creditEligible: t.Optional(t.Boolean()),
        creditLimitPsw: t.Optional(t.Number({ minimum: 0 })),
        paymentTermsDays: t.Optional(t.Number({ minimum: 0 })),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateCustomers)],
      detail: { tags: ['Customers'], summary: 'Create customer from CRM context' },
    },
  )
  .post(
    '/',
    async ({ body, set, user }) => {
      const payload = body as {
        fullname: string;
        telephone?: string | null;
        telephone2?: string | null;
        address?: string | null;
        email?: string | null;
        customerType?: number;
        creditEligible?: boolean;
        creditLimitPsw?: number;
        paymentTermsDays?: number;
        isNiaVerified?: boolean;
        loggedToGovernment?: boolean;
      };

      const res = await createCustomerCtrl({
        ...payload,
        sourceContext: 'default',
        companyId: user!.companyId!,
        createdBy: user!.sub,
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        fullname: t.String({ minLength: 1, maxLength: 255 }),
        telephone: t.Optional(t.Union([t.String(), t.Null()])),
        telephone2: t.Optional(t.Union([t.String(), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        customerType: t.Optional(t.Number()),
        creditEligible: t.Optional(t.Boolean()),
        creditLimitPsw: t.Optional(t.Number({ minimum: 0 })),
        paymentTermsDays: t.Optional(t.Number({ minimum: 0 })),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateCustomers)],
      detail: { tags: ['Customers'], summary: 'Create customer' },
    },
  )
  .patch(
    '/:id/crm',
    async ({ params, body, user }) =>
      updateCustomerCtrl(
        params.id,
        user!.companyId!,
        {
          ...(body as {
            fullname?: string;
            telephone?: string | null;
            telephone2?: string | null;
            address?: string | null;
            email?: string | null;
            customerType?: number;
            creditEligible?: boolean;
            creditLimitPsw?: number;
            paymentTermsDays?: number;
            isNiaVerified?: boolean;
            loggedToGovernment?: boolean;
          }),
          sourceContext: 'crm',
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
        customerType: t.Optional(t.Number()),
        creditEligible: t.Optional(t.Boolean()),
        creditLimitPsw: t.Optional(t.Number({ minimum: 0 })),
        paymentTermsDays: t.Optional(t.Number({ minimum: 0 })),
        isNiaVerified: t.Optional(t.Boolean()),
        loggedToGovernment: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Update customer from CRM context' },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) =>
      updateCustomerCtrl(
        params.id,
        user!.companyId!,
        {
          ...(body as {
            fullname?: string;
            telephone?: string | null;
            telephone2?: string | null;
            address?: string | null;
            email?: string | null;
            customerType?: number;
            creditEligible?: boolean;
            creditLimitPsw?: number;
            paymentTermsDays?: number;
            isNiaVerified?: boolean;
            loggedToGovernment?: boolean;
          }),
          sourceContext: 'default',
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
        customerType: t.Optional(t.Number()),
        creditEligible: t.Optional(t.Boolean()),
        creditLimitPsw: t.Optional(t.Number({ minimum: 0 })),
        paymentTermsDays: t.Optional(t.Number({ minimum: 0 })),
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
