import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { parcelReconciliationCases, parcels, users } from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function createParcelReconciliationCaseRepo(
  input: typeof parcelReconciliationCases.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(parcelReconciliationCases)
    .values(input)
    .returning({ id: parcelReconciliationCases.id });
  return row ?? null;
}

export async function getParcelReconciliationCaseRepo(id: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(parcelReconciliationCases)
    .where(eq(parcelReconciliationCases.id, id))
    .limit(1);
  return row ?? null;
}

export async function getOpenParcelReconciliationCaseByParcelRepo(
  parcelId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({ id: parcelReconciliationCases.id })
    .from(parcelReconciliationCases)
    .where(
      and(
        eq(parcelReconciliationCases.parcelId, parcelId),
        inArray(parcelReconciliationCases.status, [0, 1]),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateParcelReconciliationCaseRepo(
  id: string,
  patch: Partial<typeof parcelReconciliationCases.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(parcelReconciliationCases)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(parcelReconciliationCases.id, id))
    .returning({ id: parcelReconciliationCases.id });
  return row ?? null;
}

export async function listParcelReconciliationCasesRepo(input: {
  companyId: string;
  statuses?: number[] | null;
  branchId?: string | null;
  limit: number;
  offset: number;
  search?: string | null;
}) {
  const requester = alias(users, 'requester');
  const approver = alias(users, 'approver');
  const executorUser = alias(users, 'executor');
  const linkedParcel = alias(parcels, 'linked_parcel');

  const where = and(
    eq(parcelReconciliationCases.companyId, input.companyId),
    input.statuses?.length ? inArray(parcelReconciliationCases.status, input.statuses) : undefined,
    input.branchId ? eq(parcels.sourceId, input.branchId) : undefined,
    input.search
      ? or(
          ilike(parcels.trackingCode, `%${input.search}%`),
          ilike(parcels.bookingCode, `%${input.search}%`),
          ilike(parcelReconciliationCases.notes, `%${input.search}%`),
        )
      : undefined,
  );

  const [countRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(parcelReconciliationCases)
    .innerJoin(parcels, eq(parcelReconciliationCases.parcelId, parcels.id))
    .where(where);

  const rows = await db
    .select({
      id: parcelReconciliationCases.id,
      companyId: parcelReconciliationCases.companyId,
      parcelId: parcelReconciliationCases.parcelId,
      linkedParcelId: parcelReconciliationCases.linkedParcelId,
      caseType: parcelReconciliationCases.caseType,
      actionType: parcelReconciliationCases.actionType,
      status: parcelReconciliationCases.status,
      notes: parcelReconciliationCases.notes,
      resolutionNote: parcelReconciliationCases.resolutionNote,
      evidenceUrl: parcelReconciliationCases.evidenceUrl,
      requestedBy: parcelReconciliationCases.requestedBy,
      requestedByName: requester.fullname,
      requestedAt: parcelReconciliationCases.requestedAt,
      approvedBy: parcelReconciliationCases.approvedBy,
      approvedByName: approver.fullname,
      approvedAt: parcelReconciliationCases.approvedAt,
      executedBy: parcelReconciliationCases.executedBy,
      executedByName: executorUser.fullname,
      executedAt: parcelReconciliationCases.executedAt,
      voidedPaymentCount: parcelReconciliationCases.voidedPaymentCount,
      metadata: parcelReconciliationCases.metadata,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      parcelStatus: parcels.status,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      linkedTrackingCode: linkedParcel.trackingCode,
      linkedBookingCode: linkedParcel.bookingCode,
    })
    .from(parcelReconciliationCases)
    .innerJoin(parcels, eq(parcelReconciliationCases.parcelId, parcels.id))
    .leftJoin(linkedParcel, eq(parcelReconciliationCases.linkedParcelId, linkedParcel.id))
    .leftJoin(requester, eq(parcelReconciliationCases.requestedBy, requester.id))
    .leftJoin(approver, eq(parcelReconciliationCases.approvedBy, approver.id))
    .leftJoin(executorUser, eq(parcelReconciliationCases.executedBy, executorUser.id))
    .where(where)
    .orderBy(desc(parcelReconciliationCases.requestedAt))
    .limit(input.limit)
    .offset(input.offset);

  return {
    data: rows,
    totalRecords: Number(countRow?.c ?? 0),
  };
}
