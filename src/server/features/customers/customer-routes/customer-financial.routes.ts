import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../../utils/http-status';
import { UUID } from '../../../schemas/common';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  getCustomerByIdCtrl,
  getCustomerPaymentsMonthlyCtrl,
  listCustomerCreditOpenItemsCtrl,
  getCustomerCreditSummaryCtrl,
  listCustomerPaymentsCtrl,
  getCustomerStatementCtrl,
  listCustomerCreditTransactionsCtrl,
  postCustomerCreditPaymentCtrl,
} from '../controller';

import { listCreditParcelsSvc } from '../credit-settlement';

export const customersRoutes2 = new Elysia({ name: 'customers-2' })
  .use(authPlugin)

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
    '/:id/credit/parcels',
    ({ params, user }) =>
      listCreditParcelsSvc({
        customerId: params.id,
        companyId: user!.companyId!,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
      detail: {
        tags: ['Customers'],
        summary: 'List all outstanding credit parcels for settlement',
      },
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
        parcelIds: body.parcelIds,
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
        parcelIds: t.Array(UUID, { minItems: 1, maxItems: 200, uniqueItems: true }),
        amountCedis: t.Union([t.Number(), t.String()]),
        notes: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
        referenceId: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCustomers)],
      detail: { tags: ['Customers'], summary: 'Record customer credit payment' },
    },
  )

  .get('/:id', async ({ params, user }) => getCustomerByIdCtrl(params.id, user!.companyId!), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomers)],
    detail: { tags: ['Customers'], summary: 'Get customer' },
  });
