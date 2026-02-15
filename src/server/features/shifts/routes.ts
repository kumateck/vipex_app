import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationQuery, UUID } from '@/server/schemas/common';

const notImplemented = (scope: string) => ({
  error: {
    status: HttpStatus.NOT_IMPLEMENTED,
    message: `${scope} is defined but not implemented yet.`,
  },
});

export const shiftsRoutes = new Elysia({ name: 'shifts' })
  .get(
    '/sessions',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('List shift sessions');
    },
    {
      query: t.Intersect([
        PaginationQuery,
        t.Object({
          companyId: t.Optional(UUID),
          branchId: t.Optional(UUID),
          locationId: t.Optional(UUID),
          cashierId: t.Optional(UUID),
          status: t.Optional(t.String()),
          shiftType: t.Optional(t.String()),
        }),
      ]),
      detail: { tags: ['Shifts'], summary: 'List shift sessions', operationId: 'listShiftSessions' },
    },
  )
  .post(
    '/sessions/open',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Open shift session');
    },
    {
      body: t.Object({
        companyId: UUID,
        branchId: UUID,
        locationId: UUID,
        cashierId: UUID,
        shiftType: t.String(),
        openingCashBalanceCedis: t.Union([t.Number(), t.String()]),
        openedAt: t.Optional(t.String({ format: 'date-time' })),
        notes: t.Optional(t.String()),
      }),
      detail: { tags: ['Shifts'], summary: 'Open shift', operationId: 'openShiftSession' },
    },
  )
  .post(
    '/sessions/:id/close',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Close shift session');
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        closedAt: t.Optional(t.String({ format: 'date-time' })),
        closingCashBalanceCedis: t.Union([t.Number(), t.String()]),
        varianceReason: t.Optional(t.String()),
        handoverToUserId: t.Optional(UUID),
      }),
      detail: { tags: ['Shifts'], summary: 'Close shift', operationId: 'closeShiftSession' },
    },
  )
  .post(
    '/sessions/:id/approve',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Approve shift report');
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        approvedBy: UUID,
        comments: t.Optional(t.String()),
      }),
      detail: { tags: ['Shifts'], summary: 'Approve shift', operationId: 'approveShiftSession' },
    },
  )
  .get(
    '/sessions/:id/report',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Get shift report');
    },
    {
      params: t.Object({ id: UUID }),
      detail: { tags: ['Shifts'], summary: 'Get shift report', operationId: 'getShiftReport' },
    },
  )
  .get(
    '/sessions/active/by-branch/:branchId',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Get active shift by branch');
    },
    {
      params: t.Object({ branchId: UUID }),
      detail: {
        tags: ['Shifts'],
        summary: 'Get active shift by branch',
        operationId: 'getActiveShiftByBranch',
      },
    },
  );
