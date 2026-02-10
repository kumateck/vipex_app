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
        actualStartTime: body.actualStartTime,
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
        actualEndTime: body.actualEndTime,
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
  )

  // Get active shift
  .get(
    '/active/:branchId',
    async ({ params }) => {
      const activeShift = await db
        .select({
          id: cashierSessions.id,
          status: cashierSessions.status,
          actualStartTime: cashierSessions.actualStartTime,
          shiftTypeId: cashierSessions.shiftTypeId,
        })
        .from(cashierSessions)
        .where(
          and(eq(cashierSessions.branchId, params.branchId), eq(cashierSessions.status, 'ACTIVE')),
        )
        .limit(1);

      if (!activeShift) {
        throw new Error('No active shift found');
      }

      // Get shift type details
      const [shiftType] = await db
        .select({
          name: cashierSessions.shiftTypes.name,
          allowCrossDay: cashierSessions.shiftTypes.allowCrossDay,
        })
        .from(cashierSessions.shiftTypes)
        .where(eq(cashierSessions.shiftTypes.id, activeShift.shiftTypeId))
        .limit(1);

      return {
        sessionId: activeShift.id,
        status: activeShift.status,
        actualStartTime: activeShift.actualStartTime,
        shiftType: {
          name: shiftType?.name || 'Unknown',
          allowCrossDay: shiftType?.allowCrossDay || false,
          standardDurationHours: shiftType?.standardDurationHours || 8,
        },
      };
    },
    {
      params: t.Object({ branchId: UUID }),
      detail: {
        tags: ['Shift Management'],
        summary: 'Get currently active shift for a branch',
        operationId: 'getActiveShift',
      },
    },
  );
