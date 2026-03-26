import { createAuditLogSvc } from './service';
import { logger as devLogger } from '@/server/utils/logger';

export async function recordAuditLog(input: {
  companyId?: string | null;
  actorUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  message?: string | null;
  metadata?: unknown;
}) {
  if (!input.companyId) return;

  try {
    await createAuditLogSvc({
      companyId: input.companyId,
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      message: input.message ?? null,
      metadata: input.metadata,
    });
  } catch (error) {
    devLogger.error('audit-log-failed', error);
  }
}
