import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQueryProps, UUID } from '../../schemas/common';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  closeSessionCtrl,
  createSessionTypeCtrl,
  getCurrentActiveSessionCtrl,
  getCurrentActiveSessionSummaryCtrl,
  getSessionByIdCtrl,
  listSessionTypesCtrl,
  listSessionsCtrl,
  openSessionCtrl,
} from './controller';

export const cashiersRoutes = new Elysia({ name: 'cashiers' })
  .use(authPlugin)
  .get('/session-types', async () => listSessionTypesCtrl(), {
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCashierSessionTypes)],
    detail: { tags: ['Cashiers'], summary: 'List cashier session types' },
  })
  .post(
    '/session-types',
    async ({ body, set, user }) => {
      const res = await createSessionTypeCtrl({
        ...(body as { sessionType: string; startTime: string; endTime: string }),
        createdBy: (user as AuthUser).sub,
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        sessionType: t.String({ minLength: 1, maxLength: 50 }),
        startTime: t.String({ minLength: 4, maxLength: 5 }), // "08:00"
        endTime: t.String({ minLength: 4, maxLength: 5 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateCashierSessionTypes),
      ],
      detail: { tags: ['Cashiers'], summary: 'Create session type' },
    },
  )
  .get(
    '/sessions',
    async ({ query }) =>
      listSessionsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          cashierId: query.cashierId ?? null,
          branchId: query.branchId ?? null,
          activeOnly: query.activeOnly ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        cashierId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        activeOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCashierSessions)],
      detail: { tags: ['Cashiers'], summary: 'List cashier sessions' },
    },
  )
  .get('/sessions/:id', async ({ params }) => getSessionByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCashierSessions)],
    detail: { tags: ['Cashiers'], summary: 'Get session' },
  })
  .get(
    '/sessions/active/current',
    async ({ user }) =>
      getCurrentActiveSessionCtrl({
        cashierId: (user as AuthUser).sub,
        branchId: (user as AuthUser).branchId ?? null,
      }),
    {
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCashierSessions)],
      detail: { tags: ['Cashiers'], summary: 'Get current cashier active session' },
    },
  )
  .get(
    '/sessions/active/current/summary',
    async ({ user, query }) =>
      getCurrentActiveSessionSummaryCtrl({
        cashierId: (user as AuthUser).sub,
        branchId: (user as AuthUser).branchId ?? null,
        mode: query.mode ?? 'sender',
      }),
    {
      query: t.Object({
        mode: t.Optional(
          t.Union([
            t.Literal('sender'),
            t.Literal('receiver'),
            t.Literal('delivery'),
            t.Literal('full'),
          ]),
        ),
      }),
      response: t.Union([
        t.Null(),
        t.Object({
          sessionId: UUID,
          amountPaidPsw: t.Number(),
          toBePaidPsw: t.Number(),
          totalSalesPsw: t.Number(),
          totalCreditCreatedPsw: t.Number(),
          totalToBePaidCollectedPsw: t.Number(),
          totalDeliveryFeeCollectedPsw: t.Number(),
          totalFullCashierExpectedPsw: t.Number(),
          mode: t.Union([
            t.Literal('sender'),
            t.Literal('receiver'),
            t.Literal('delivery'),
            t.Literal('full'),
          ]),
        }),
      ]),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCashierSessions)],
      detail: { tags: ['Cashiers'], summary: 'Get active session financial summary' },
    },
  )
  .post(
    '/sessions',
    async ({ body, set, user }) => {
      const authUser = user as AuthUser;
      const payload = body as {
        sessionTypeId: string;
        startTime: string;
        openingBalanceCedis?: number | string | null;
      };
      const response = await openSessionCtrl({
        ...payload,
        companyId: authUser.companyId ?? null,
        actorUserId: authUser.sub,
        cashierId: authUser.sub,
        branchId: authUser.branchId ?? '',
        allowSameDayReopen: !!authUser.permissions?.includes(
          PermissionKeys.CanReopenCashierSessions,
        ),
      });
      set.status = HttpStatus.CREATED;
      return response;
    },
    {
      body: t.Object({
        sessionTypeId: UUID,
        startTime: t.String({ format: 'date-time' }),
        openingBalanceCedis: t.Optional(t.Union([t.Number(), t.String()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanOpenCashierSessions)],
      detail: { tags: ['Cashiers'], summary: 'Open cashier session' },
    },
  )
  .post(
    '/sessions/:id/close',
    async ({ params, body, user }) =>
      closeSessionCtrl(params.id, {
        ...(body as { endTime: string; closingBalanceCedis?: number | string | null }),
        companyId: (user as AuthUser).companyId ?? null,
        actorUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        endTime: t.String({ format: 'date-time' }),
        closingBalanceCedis: t.Optional(t.Union([t.Number(), t.String()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCloseCashierSessions)],
      detail: { tags: ['Cashiers'], summary: 'Close cashier session' },
    },
  );
