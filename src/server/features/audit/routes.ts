import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQuery, UUID } from '@/server/schemas/common';

const notImplemented = (scope: string) => ({
  error: {
    status: HttpStatus.NOT_IMPLEMENTED,
    message: `${scope} is defined but not implemented yet.`,
  },
});

export const auditRoutes = new Elysia({ name: 'audit' })
  .get(
    '/logs',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('List audit logs');
    },
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          actorUserId: t.Optional(UUID),
          entityType: t.Optional(t.String()),
          entityId: t.Optional(UUID),
          action: t.Optional(t.String()),
          from: t.Optional(t.String({ format: 'date-time' })),
          to: t.Optional(t.String({ format: 'date-time' })),
        }),
      ]),
      detail: { tags: ['Audit'], summary: 'List audit logs', operationId: 'listAuditLogs' },
    },
  )
  .get(
    '/logs/:id',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Get audit log');
    },
    {
      params: t.Object({ id: UUID }),
      detail: { tags: ['Audit'], summary: 'Get audit log', operationId: 'getAuditLog' },
    },
  )
  .get(
    '/entities/:entityType/:entityId',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Get entity audit history');
    },
    {
      params: t.Object({
        entityType: t.String(),
        entityId: UUID,
      }),
      query: t.Object({
        from: t.Optional(t.String({ format: 'date-time' })),
        to: t.Optional(t.String({ format: 'date-time' })),
      }),
      detail: {
        tags: ['Audit'],
        summary: 'Get entity audit history',
        operationId: 'getEntityAuditHistory',
      },
    },
  )
  .post(
    '/exports',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Create audit export job');
    },
    {
      body: t.Object({
        requestedBy: UUID,
        from: t.String({ format: 'date-time' }),
        to: t.String({ format: 'date-time' }),
        format: t.String(),
      }),
      detail: {
        tags: ['Audit'],
        summary: 'Create audit export job',
        operationId: 'createAuditExportJob',
      },
    },
  );
