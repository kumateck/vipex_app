import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export interface EntityAuditLog {
  id: string;
  companyId: string;
  actorUserId?: string | null;
  actorUserName?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  message?: string | null;
  metadata?: unknown;
  createdAt: string;
}

export const auditApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAuditLogs: builder.query<
      ServerListResponse<EntityAuditLog>,
      ServerListQuery<{
        actorUserId?: string | null;
        entityType?: string | null;
        entityId?: string | null;
        action?: string | null;
        from?: string | null;
        to?: string | null;
      }> | void
    >({
      query: (query) => ({
        url: '/audit/logs',
        params: buildServerPaginationParams(query),
      }),
    }),
    getEntityAuditHistory: builder.query<
      { data: EntityAuditLog[] },
      { entityType: string; entityId: string }
    >({
      query: ({ entityType, entityId }) => ({
        url: `/audit/entities/${entityType}/${entityId}`,
      }),
    }),
  }),
});

export const { useListAuditLogsQuery, useGetEntityAuditHistoryQuery } = auditApi;
