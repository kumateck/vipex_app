import { NotFound } from '@/server/utils/http-error';
import {
  createAuditLogRepo,
  getAuditAnalyticsRepo,
  getAuditLogRepo,
  type AuditAnalyticsParams,
  listAuditLogsRepo,
  type ListAuditLogsParams,
} from './repository';

export async function createAuditLogSvc(input: {
  companyId: string;
  actorUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  message?: string | null;
  metadata?: unknown;
}) {
  return createAuditLogRepo({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    action: input.action,
    message: input.message ?? null,
    metadata: input.metadata,
  });
}

export async function listAuditLogsSvc(p: ListAuditLogsParams) {
  return listAuditLogsRepo(p);
}

export async function getAuditAnalyticsSvc(p: AuditAnalyticsParams) {
  return getAuditAnalyticsRepo(p);
}

export async function getAuditLogSvc(id: string, companyId: string) {
  const row = await getAuditLogRepo(id, companyId);
  if (!row) throw NotFound('Audit log not found');
  return row;
}
