import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import { createAuditLogSvc, getAuditLogSvc, listAuditLogsSvc } from './service';

export async function listAuditLogsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    actorUserId?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    action?: string | null;
    from?: string | null;
    to?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listAuditLogsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? '',
    actorUserId: q.filters?.actorUserId ?? null,
    entityType: q.filters?.entityType ?? null,
    entityId: q.filters?.entityId ?? null,
    action: q.filters?.action ?? null,
    from: q.filters?.from ?? null,
    to: q.filters?.to ?? null,
    search: pagination.search ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getAuditLogCtrl(id: string, companyId: string) {
  const row = await getAuditLogSvc(id, companyId);
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function listEntityAuditHistoryCtrl(input: {
  companyId: string;
  entityType: string;
  entityId: string;
  from?: string | null;
  to?: string | null;
}) {
  const { data } = await listAuditLogsSvc({
    companyId: input.companyId,
    limit: 200,
    offset: 0,
    entityType: input.entityType,
    entityId: input.entityId,
    from: input.from ?? null,
    to: input.to ?? null,
    sort: [{ field: 'createdAt', direction: 'desc' }],
  });

  return data.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function createAuditExportJobCtrl(input: {
  companyId: string;
  requestedBy: string;
  from: string;
  to: string;
  format: string;
}) {
  await createAuditLogSvc({
    companyId: input.companyId,
    actorUserId: input.requestedBy,
    entityType: 'audit',
    action: 'AUDIT_EXPORT_REQUESTED',
    message: `Audit export requested in ${input.format} format`,
    metadata: {
      from: input.from,
      to: input.to,
      format: input.format,
    },
  });

  return {
    status: 'QUEUED',
    requestedBy: input.requestedBy,
    from: input.from,
    to: input.to,
    format: input.format,
  };
}
