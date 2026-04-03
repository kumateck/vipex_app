import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, users } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';
import { ensureAuditStorageReady } from './storage';

export type AuditLogRow = {
  id: string;
  companyId: string;
  actorUserId: string | null;
  actorUserName: string | null;
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

export type AuditAnalyticsParams = {
  companyId: string;
  from?: string | null;
  to?: string | null;
};

export type AuditAnalyticsSummary = {
  totalEvents: number;
  suspiciousActions: number;
  deletedActions: number;
  rolePermissionChanges: number;
  moduleChanges: number;
  securitySignals: number;
  recentHighRiskEvents: AuditLogRow[];
  recentTechEvents: AuditLogRow[];
};

function buildAuditLogWhere(params: {
  companyId: string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  action?: string | null;
  from?: string | null;
  to?: string | null;
  search?: string | null;
}) {
  const where = [eq(auditLogs.companyId, params.companyId)];
  if (params.actorUserId) where.push(eq(auditLogs.actorUserId, params.actorUserId));
  if (params.entityType) where.push(eq(auditLogs.entityType, params.entityType));
  if (params.entityId) where.push(eq(auditLogs.entityId, params.entityId));
  if (params.action) where.push(eq(auditLogs.action, params.action));
  if (params.from) where.push(gte(auditLogs.createdAt, new Date(params.from)));
  if (params.to) where.push(lte(auditLogs.createdAt, new Date(params.to)));
  if (params.search) {
    where.push(
      or(
        ilike(auditLogs.action, `%${params.search}%`),
        ilike(auditLogs.entityType, `%${params.search}%`),
        ilike(auditLogs.message, `%${params.search}%`),
      )!,
    );
  }
  return where;
}

function buildKeywordCondition(columns: Array<Parameters<typeof ilike>[0]>, keywords: string[]) {
  const clauses = keywords.flatMap((keyword) =>
    columns.map((column) => ilike(column, `%${keyword}%`)),
  );
  return or(...clauses);
}

export async function createAuditLogRepo(
  values: typeof auditLogs.$inferInsert,
): Promise<{ id: string }> {
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

  const where = buildAuditLogWhere(p);

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
      actorUserName: users.fullname,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      message: auditLogs.message,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords };
}

export async function getAuditAnalyticsRepo(
  p: AuditAnalyticsParams,
): Promise<AuditAnalyticsSummary> {
  const enabled = await ensureAuditStorageReady();
  if (!enabled) {
    return {
      totalEvents: 0,
      suspiciousActions: 0,
      deletedActions: 0,
      rolePermissionChanges: 0,
      moduleChanges: 0,
      securitySignals: 0,
      recentHighRiskEvents: [],
      recentTechEvents: [],
    };
  }

  const baseWhere = buildAuditLogWhere({
    companyId: p.companyId,
    from: p.from ?? null,
    to: p.to ?? null,
  });

  const suspiciousCondition = buildKeywordCondition(
    [auditLogs.action, auditLogs.message],
    ['suspicious', 'override', 'failed', 'reject'],
  );
  const deletedCondition = ilike(auditLogs.action, '%delete%');
  const rolePermissionCondition = buildKeywordCondition(
    [auditLogs.entityType, auditLogs.action, auditLogs.message],
    ['role', 'permission', 'rbac'],
  );
  const moduleCondition = buildKeywordCondition(
    [auditLogs.entityType, auditLogs.action, auditLogs.message],
    ['module', 'companymodule'],
  );
  const securityCondition = buildKeywordCondition(
    [auditLogs.action, auditLogs.message],
    ['login', 'password', 'token', 'unauthorized', 'forbidden'],
  );
  const highRiskCondition = buildKeywordCondition(
    [auditLogs.action, auditLogs.message],
    ['delete', 'override', 'reject', 'suspicious'],
  );
  const techEventCondition = buildKeywordCondition(
    [auditLogs.entityType, auditLogs.action, auditLogs.message],
    ['role', 'permission', 'module', 'user'],
  );

  const [
    totalEventsResult,
    suspiciousActionsResult,
    deletedActionsResult,
    rolePermissionChangesResult,
    moduleChangesResult,
    securitySignalsResult,
    recentHighRiskEvents,
    recentTechEvents,
  ] = await Promise.all([
    db
      .select({ c: count() })
      .from(auditLogs)
      .where(and(...baseWhere)),
    db
      .select({ c: count() })
      .from(auditLogs)
      .where(and(...baseWhere, suspiciousCondition!)),
    db
      .select({ c: count() })
      .from(auditLogs)
      .where(and(...baseWhere, deletedCondition)),
    db
      .select({ c: count() })
      .from(auditLogs)
      .where(and(...baseWhere, rolePermissionCondition!)),
    db
      .select({ c: count() })
      .from(auditLogs)
      .where(and(...baseWhere, moduleCondition!)),
    db
      .select({ c: count() })
      .from(auditLogs)
      .where(and(...baseWhere, securityCondition!)),
    db
      .select({
        id: auditLogs.id,
        companyId: auditLogs.companyId,
        actorUserId: auditLogs.actorUserId,
        actorUserName: users.fullname,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        message: auditLogs.message,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorUserId))
      .where(and(...baseWhere, highRiskCondition!))
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(8),
    db
      .select({
        id: auditLogs.id,
        companyId: auditLogs.companyId,
        actorUserId: auditLogs.actorUserId,
        actorUserName: users.fullname,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        message: auditLogs.message,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorUserId))
      .where(and(...baseWhere, techEventCondition!))
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(8),
  ]);

  const countValue = (value: { c: unknown }[] | undefined) =>
    Number((value?.[0]?.c as bigint) ?? 0n);

  return {
    totalEvents: countValue(totalEventsResult),
    suspiciousActions: countValue(suspiciousActionsResult),
    deletedActions: countValue(deletedActionsResult),
    rolePermissionChanges: countValue(rolePermissionChangesResult),
    moduleChanges: countValue(moduleChangesResult),
    securitySignals: countValue(securitySignalsResult),
    recentHighRiskEvents,
    recentTechEvents,
  };
}

export async function getAuditLogRepo(id: string, companyId: string): Promise<AuditLogRow | null> {
  const enabled = await ensureAuditStorageReady();
  if (!enabled) return null;

  const [row] = await db
    .select({
      id: auditLogs.id,
      companyId: auditLogs.companyId,
      actorUserId: auditLogs.actorUserId,
      actorUserName: users.fullname,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      message: auditLogs.message,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(and(eq(auditLogs.id, id), eq(auditLogs.companyId, companyId)))
    .limit(1);

  return row ?? null;
}
