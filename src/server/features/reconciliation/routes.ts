import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { NonEmpty255, PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  approveBankSettlementCtrl,
  approveReconciliationSessionCtrl,
  createBankSettlementCtrl,
  createReconciliationSessionCtrl,
  finalizeReconciliationSessionCtrl,
  listBankSettlementsCtrl,
  listReconciliationBranchOptionsCtrl,
  listReconciliationSessionsCtrl,
  rejectBankSettlementCtrl,
} from './controller';

export const reconciliationRoutes = new Elysia({ name: 'reconciliation' })
  .use(authPlugin)
  .get(
    '/branch-options',
    async ({ user }) => listReconciliationBranchOptionsCtrl((user as AuthUser).companyId!),
    {
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadReconciliation),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'List reconciliation branch options' },
    },
  )
  .get(
    '/sessions',
    async ({ query, user }) =>
      listReconciliationSessionsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          status: query.status,
          branchId: query.branchId,
          pendingOnly: query.pendingOnly ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        status: t.Optional(t.Number()),
        branchId: t.Optional(UUID),
        pendingOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadReconciliation),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'List reconciliation sessions' },
    },
  )
  .post(
    '/sessions',
    async ({ body, user, set }) => {
      const result = await createReconciliationSessionCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        branchId: body.branchId,
        confirmationDate: body.confirmationDate,
        expectedCashCedis: body.expectedCashCedis,
        countedCashCedis: body.countedCashCedis,
        notes: body.notes ?? null,
        cashierUserId: body.cashierUserId ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: UUID,
        confirmationDate: t.String({ format: 'date-time' }),
        expectedCashCedis: t.Union([t.Number(), t.String()]),
        countedCashCedis: t.Union([t.Number(), t.String()]),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        cashierUserId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateReconciliationSessions),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'Create reconciliation session' },
    },
  )
  .post(
    '/sessions/:id/approve',
    async ({ params, user }) =>
      approveReconciliationSessionCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveReconciliationSessions),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'Approve reconciliation session' },
    },
  )
  .post(
    '/sessions/:id/finalize',
    async ({ params, user }) =>
      finalizeReconciliationSessionCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveReconciliationSessions),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'Finalize reconciliation session' },
    },
  )
  .get(
    '/bank-settlements',
    async ({ query, user }) =>
      listBankSettlementsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          status: query.status,
          branchId: query.branchId,
          pendingOnly: query.pendingOnly ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        status: t.Optional(t.Number()),
        branchId: t.Optional(UUID),
        pendingOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadReconciliation),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'List bank settlements' },
    },
  )
  .post(
    '/bank-settlements',
    async ({ body, user, set }) => {
      const result = await createBankSettlementCtrl({
        companyId: (user as AuthUser).companyId!,
        submittedByUserId: (user as AuthUser).sub,
        branchId: body.branchId,
        settlementDate: body.settlementDate,
        settlementNo: body.settlementNo ?? null,
        bankReference: body.bankReference ?? null,
        expectedAmountPsw: body.expectedAmountPsw,
        bankedAmountPsw: body.bankedAmountPsw,
        notes: body.notes ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: UUID,
        settlementDate: t.String({ format: 'date-time' }),
        settlementNo: t.Optional(t.Union([t.String({ maxLength: 60 }), t.Null()])),
        bankReference: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
        expectedAmountPsw: t.Number({ minimum: 0 }),
        bankedAmountPsw: t.Number({ minimum: 0 }),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateReconciliationBankSettlements),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'Create bank settlement record' },
    },
  )
  .post(
    '/bank-settlements/:id/approve',
    async ({ params, user }) =>
      approveBankSettlementCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveReconciliationBankSettlements),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'Approve bank settlement record' },
    },
  )
  .post(
    '/bank-settlements/:id/reject',
    async ({ params, body, user }) =>
      rejectBankSettlementCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
        rejectionReason: body.rejectionReason,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ rejectionReason: NonEmpty255 }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveReconciliationBankSettlements),
        requireModuleEnabled('reconciliation'),
      ],
      detail: { tags: ['Reconciliation'], summary: 'Reject bank settlement record' },
    },
  );
