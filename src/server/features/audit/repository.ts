import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';
import { ensureAuditStorageReady } from './storage';

export type AuditLogRow = {
  id: string;
  companyId: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  message: string | null;
  metadata: unknown;
  createdAt: Date;
};

export type ListAuditLogsParams = {
  limit: number;
  offset: number;
  companyId: string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  action?: string | null;
  search?: string | null;
  from?: string | null;
  to?: string | null;
  sort?: SortField[] | null;
};

export async function createAuditLogRepo(values: typeof auditLogs.$inferInsert): Promise<{ id: string }> {
  const enabled = await ensureAuditStorageReady();
  if (!enabled) return { id: 'audit-unavailable' };
  const [row] = await db.insert(auditLogs).values(values).returning({ id: auditLogs.id });
  return row!;
}

export async function listAuditLogsRepo(
  p: ListAuditLogsParams,
): Promise<{ data: AuditLogRow[]; totalRecords: number }> {
  const enabled = await ensureAuditStorageReady();
  if (!enabled) return { data: [], totalRecords: 0 };

  const where = [eq(auditLogs.companyId, p.companyId)];
  if (p.actorUserId) where.push(eq(auditLogs.actorUserId, p.actorUserId));
  if (p.entityType) where.push(eq(auditLogs.entityType, p.entityType));
  if (p.entityId) where.push(eq(auditLogs.entityId, p.entityId));
  if (p.action) where.push(eq(auditLogs.action, p.action));
  if (p.from) where.push(gte(auditLogs.createdAt, new Date(p.from)));
  if (p.to) where.push(lte(auditLogs.createdAt, new Date(p.to)));
  if (p.search) {
    where.push(
      or(
        ilike(auditLogs.action, `%${p.search}%`),
        ilike(auditLogs.entityType, `%${p.search}%`),
        ilike(auditLogs.message, `%${p.search}%`),
      )!,
    );
  }

  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt') {
            return s.direction === 'desc' ? desc(auditLogs.createdAt) : asc(auditLogs.createdAt);
          }
          if (s.field === 'action') {
            return s.direction === 'desc' ? desc(auditLogs.action) : asc(auditLogs.action);
          }
          if (s.field === 'entityType') {
            return s.direction === 'desc' ? desc(auditLogs.entityType) : asc(auditLogs.entityType);
          }
          if (s.field === 'id') {
            return s.direction === 'desc' ? desc(auditLogs.id) : asc(auditLogs.id);
          }
          return null;
        })
        .filter((v): v is ReturnType<typeof asc> => v !== null)
    : [desc(auditLogs.createdAt), desc(auditLogs.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(auditLogs)
    .where(and(...where));

  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const data = await db
    .select({
      id: auditLogs.id,
      companyId: auditLogs.companyId,
      actorUserId: auditLogs.actorUserId,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      message: auditLogs.message,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords };
}

export async function getAuditLogRepo(id: string, companyId: string): Promise<AuditLogRow | null> {
  const enabled = await ensureAuditStorageReady();
  if (!enabled) return null;

  const [row] = await db
    .select({
      id: auditLogs.id,
      companyId: auditLogs.companyId,
      actorUserId: auditLogs.actorUserId,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      message: auditLogs.message,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(and(eq(auditLogs.id, id), eq(auditLogs.companyId, companyId)))
    .limit(1);

  return row ?? null;
}
