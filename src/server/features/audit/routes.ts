import { Elysia, t } from 'elysia';
import { PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  createAuditExportJobCtrl,
  getAuditLogCtrl,
  listAuditLogsCtrl,
  listEntityAuditHistoryCtrl,
} from './controller';

export const auditRoutes = new Elysia({ name: 'audit' })
  .use(authPlugin)
  .get(
    '/logs',
    async ({ query, user }) => {
      return listAuditLogsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: user!.companyId!,
          actorUserId: query.actorUserId ?? null,
          entityType: query.entityType ?? null,
          entityId: query.entityId ?? null,
          action: query.action ?? null,
          from: query.from ?? null,
          to: query.to ?? null,
        },
      });
    },
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        actorUserId: t.Optional(UUID),
        entityType: t.Optional(t.String()),
        entityId: t.Optional(UUID),
        action: t.Optional(t.String()),
        from: t.Optional(t.String({ format: 'date-time' })),
        to: t.Optional(t.String({ format: 'date-time' })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanListAuditLogs)],
      detail: { tags: ['Audit'], summary: 'List audit logs', operationId: 'listAuditLogs' },
    },
  )
  .get(
    '/logs/:id',
    async ({ params, user }) => {
      return getAuditLogCtrl(params.id, user!.companyId!);
    },
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanGetAuditLog)],
      detail: { tags: ['Audit'], summary: 'Get audit log', operationId: 'getAuditLog' },
    },
  )
  .get(
    '/entities/:entityType/:entityId',
    async ({ params, query, user }) => {
      return {
        data: await listEntityAuditHistoryCtrl({
          companyId: user!.companyId!,
          entityType: params.entityType,
          entityId: params.entityId,
          from: query.from ?? null,
          to: query.to ?? null,
        }),
      };
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
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanGetEntityAuditHistory)],
      detail: {
        tags: ['Audit'],
        summary: 'Get entity audit history',
        operationId: 'getEntityAuditHistory',
      },
    },
  )
  .post(
    '/exports',
    async ({ body, user }) => {
      return createAuditExportJobCtrl({
        companyId: user!.companyId!,
        requestedBy: user!.sub,
        from: body.from,
        to: body.to,
        format: body.format,
      });
    },
    {
      body: t.Object({
        from: t.String({ format: 'date-time' }),
        to: t.String({ format: 'date-time' }),
        format: t.String(),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateAuditExportJob)],
      detail: {
        tags: ['Audit'],
        summary: 'Create audit export job',
        operationId: 'createAuditExportJob',
      },
    },
  );
