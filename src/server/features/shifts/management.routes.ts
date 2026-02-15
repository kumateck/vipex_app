import { Elysia, t } from 'elysia';
import { UUID, NonEmptyString255 } from '../../schemas/common';
import { startShift, endShift, getShiftAnalytics } from './management.service';

export const shiftManagementRoutes = new Elysia({ name: 'shift-management' })
  // Start shift
  .post(
    '/sessions/:sessionId/start',
    async ({ params, body }) =>
      startShift({
        sessionId: params.sessionId,
        openingBalancePsw: body.openingBalancePsw,
        notes: body.notes,
        actualStartTime: body.actualStartTime ? new Date(body.actualStartTime) : undefined,
      }),
    {
      params: t.Object({ sessionId: UUID }),
      body: t.Object({
        openingBalancePsw: NonEmptyString255,
        notes: t.Optional(t.String()),
        actualStartTime: t.Optional(t.String({ format: 'date-time' })),
      }),
      detail: {
        tags: ['Shift Management'],
        summary: 'Start cashier session with shift tracking',
        operationId: 'startShift',
      },
    },
  )

  // End shift
  .post(
    '/sessions/:sessionId/end',
    async ({ params, body }) =>
      endShift({
        sessionId: params.sessionId,
        closingBalancePsw: body.closingBalancePsw,
        handoverToCashierId: body.handoverToCashierId,
        handoverNotes: body.handoverNotes,
        actualEndTime: body.actualEndTime ? new Date(body.actualEndTime) : undefined,
        varianceReason: body.varianceReason,
      }),
    {
      params: t.Object({ sessionId: UUID }),
      body: t.Object({
        closingBalancePsw: NonEmptyString255,
        handoverToCashierId: t.Optional(UUID),
        handoverNotes: t.Optional(t.String()),
        actualEndTime: t.Optional(t.String({ format: 'date-time' })),
        varianceReason: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Shift Management'],
        summary: 'End cashier session with comprehensive reporting',
        operationId: 'endShift',
      },
    },
  )

  // Get shift analytics
  .get(
    '/analytics/:branchId',
    async ({ params, query }) =>
      getShiftAnalytics(
        params.branchId,
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined,
      ),
    {
      params: t.Object({ branchId: UUID }),
      query: t.Object({
        startDate: t.Optional(t.String({ format: 'date' })),
        endDate: t.Optional(t.String({ format: 'date' })),
      }),
      detail: {
        tags: ['Shift Management', 'Analytics'],
        summary: 'Get comprehensive shift analytics and metrics',
        operationId: 'getShiftAnalytics',
      },
    },
  );
