import { api } from '@/services/api';

export interface EntityAuditLog {
  id: string;
  companyId: string;
  actorUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  message?: string | null;
  metadata?: unknown;
  createdAt: string;
}

export const auditApi = api.injectEndpoints({
  endpoints: (builder) => ({
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

export const { useGetEntityAuditHistoryQuery } = auditApi;
