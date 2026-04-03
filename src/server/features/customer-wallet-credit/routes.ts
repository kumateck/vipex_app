import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  blockCustomerWalletAccountCtrl,
  listCustomerWalletAccountsCtrl,
  listCustomerWalletApprovalsCtrl,
  postCustomerWalletPaymentCtrl,
  unblockCustomerWalletAccountCtrl,
} from './controller';

export const customerWalletCreditRoutes = new Elysia({ name: 'customer-wallet-credit' })
  .use(authPlugin)
  .get(
    '/accounts',
    async ({ query, user }) =>
      listCustomerWalletAccountsCtrl(user as AuthUser, {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          creditEligible: query.creditEligible,
          overdueOnly: query.overdueOnly,
          approvalOnly: query.approvalOnly,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        creditEligible: t.Optional(t.Boolean()),
        overdueOnly: t.Optional(t.Boolean()),
        approvalOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCustomerWalletCredit),
        requireModuleEnabled('customer_wallet_credit'),
      ],
      detail: { tags: ['CustomerWalletCredit'], summary: 'List customer wallet/credit accounts' },
    },
  )
  .get(
    '/approvals',
    async ({ query, user }) =>
      listCustomerWalletApprovalsCtrl(user as AuthUser, {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          creditEligible: query.creditEligible,
          overdueOnly: query.overdueOnly,
          approvalOnly: true,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        creditEligible: t.Optional(t.Boolean()),
        overdueOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveCustomerWalletCreditControls),
        requireModuleEnabled('customer_wallet_credit'),
      ],
      detail: { tags: ['CustomerWalletCredit'], summary: 'List customer wallet approval queue' },
    },
  )
  .post(
    '/accounts/:customerId/payments',
    async ({ params, body, user, set }) => {
      const result = await postCustomerWalletPaymentCtrl(user as AuthUser, params.customerId, {
        amountCedis: body.amountCedis,
        notes: body.notes ?? null,
        referenceId: body.referenceId ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      params: t.Object({ customerId: UUID }),
      body: t.Object({
        amountCedis: t.Union([t.Number(), t.String()]),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        referenceId: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateCustomerWalletCreditPayments),
        requireModuleEnabled('customer_wallet_credit'),
      ],
      detail: { tags: ['CustomerWalletCredit'], summary: 'Record wallet/credit payment' },
    },
  )
  .post(
    '/accounts/:customerId/block',
    async ({ params, user }) => blockCustomerWalletAccountCtrl(user as AuthUser, params.customerId),
    {
      params: t.Object({ customerId: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveCustomerWalletCreditControls),
        requireModuleEnabled('customer_wallet_credit'),
      ],
      detail: { tags: ['CustomerWalletCredit'], summary: 'Block customer credit access' },
    },
  )
  .post(
    '/accounts/:customerId/unblock',
    async ({ params, user }) =>
      unblockCustomerWalletAccountCtrl(user as AuthUser, params.customerId),
    {
      params: t.Object({ customerId: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveCustomerWalletCreditControls),
        requireModuleEnabled('customer_wallet_credit'),
      ],
      detail: { tags: ['CustomerWalletCredit'], summary: 'Unblock customer credit access' },
    },
  );
