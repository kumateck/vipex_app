import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  cashierSessions,
  customers,
  parcelReconciliationCases,
  parcels,
  users,
} from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function listEligibleParcelCorrectionSessionsRepo(input: {
  cashierId: string;
  branchId: string;
  occurredAt: Date;
  preferredSessionId?: string | null;
}) {
  const sessionStart = sql<Date>`coalesce(${cashierSessions.actualStartTime}, ${cashierSessions.scheduledStartTime})`;
  const sessionEnd = sql<Date>`coalesce(${cashierSessions.actualEndTime}, ${cashierSessions.scheduledEndTime})`;

  return db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      cashierName: users.fullname,
      branchId: cashierSessions.branchId,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      scheduledEndTime: cashierSessions.scheduledEndTime,
      actualStartTime: cashierSessions.actualStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      status: cashierSessions.status,
    })
    .from(cashierSessions)
    .leftJoin(users, eq(cashierSessions.cashierId, users.id))
    .where(
      and(
        eq(cashierSessions.cashierId, input.cashierId),
        eq(cashierSessions.branchId, input.branchId),
        or(
          input.preferredSessionId ? eq(cashierSessions.id, input.preferredSessionId) : undefined,
          and(lte(sessionStart, input.occurredAt), gte(sessionEnd, input.occurredAt)),
        ),
      ),
    )
    .orderBy(desc(cashierSessions.scheduledStartTime));
}

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
  const sessionCashier = alias(users, 'session_cashier');
  const senderCustomer = alias(customers, 'reconciliation_sender');
  const receiverCustomer = alias(customers, 'reconciliation_receiver');
  const linkedParcel = alias(parcels, 'linked_parcel');

  const where = and(
    eq(parcelReconciliationCases.companyId, input.companyId),
    input.statuses?.length ? inArray(parcelReconciliationCases.status, input.statuses) : undefined,
    input.branchId ? eq(parcels.sourceId, input.branchId) : undefined,
    input.search
      ? or(
          ilike(parcels.trackingCode, `%${input.search}%`),
          ilike(parcels.bookingCode, `%${input.search}%`),
          ilike(senderCustomer.telephone, `%${input.search}%`),
          ilike(senderCustomer.telephone2, `%${input.search}%`),
          ilike(receiverCustomer.telephone, `%${input.search}%`),
          ilike(receiverCustomer.telephone2, `%${input.search}%`),
          ilike(parcelReconciliationCases.notes, `%${input.search}%`),
        )
      : undefined,
  );

  const countPromise = db
    .select({ c: sql<number>`count(*)` })
    .from(parcelReconciliationCases)
    .innerJoin(parcels, eq(parcelReconciliationCases.parcelId, parcels.id))
    .leftJoin(senderCustomer, eq(parcels.senderId, senderCustomer.id))
    .leftJoin(receiverCustomer, eq(parcels.receiverId, receiverCustomer.id))
    .where(where);

  const rowsPromise = db
    .select({
      id: parcelReconciliationCases.id,
      companyId: parcelReconciliationCases.companyId,
      parcelId: parcelReconciliationCases.parcelId,
      linkedParcelId: parcelReconciliationCases.linkedParcelId,
      cashierSessionId: parcelReconciliationCases.cashierSessionId,
      effectiveAt: parcelReconciliationCases.effectiveAt,
      originalChargePsw: parcelReconciliationCases.originalChargePsw,
      proposedChargePsw: parcelReconciliationCases.proposedChargePsw,
      originalPlannedToBePaidPsw: parcelReconciliationCases.originalPlannedToBePaidPsw,
      proposedPlannedToBePaidPsw: parcelReconciliationCases.proposedPlannedToBePaidPsw,
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
      currentChargePsw: parcels.chargePsw,
      currentPlannedToBePaidPsw: parcels.plannedToBePaidPsw,
      sessionCashierName: sessionCashier.fullname,
      sessionScheduledStartTime: cashierSessions.scheduledStartTime,
      sessionScheduledEndTime: cashierSessions.scheduledEndTime,
      sessionStatus: cashierSessions.status,
      linkedTrackingCode: linkedParcel.trackingCode,
      linkedBookingCode: linkedParcel.bookingCode,
    })
    .from(parcelReconciliationCases)
    .innerJoin(parcels, eq(parcelReconciliationCases.parcelId, parcels.id))
    .leftJoin(senderCustomer, eq(parcels.senderId, senderCustomer.id))
    .leftJoin(receiverCustomer, eq(parcels.receiverId, receiverCustomer.id))
    .leftJoin(linkedParcel, eq(parcelReconciliationCases.linkedParcelId, linkedParcel.id))
    .leftJoin(requester, eq(parcelReconciliationCases.requestedBy, requester.id))
    .leftJoin(approver, eq(parcelReconciliationCases.approvedBy, approver.id))
    .leftJoin(executorUser, eq(parcelReconciliationCases.executedBy, executorUser.id))
    .leftJoin(cashierSessions, eq(parcelReconciliationCases.cashierSessionId, cashierSessions.id))
    .leftJoin(sessionCashier, eq(cashierSessions.cashierId, sessionCashier.id))
    .where(where)
    .orderBy(desc(parcelReconciliationCases.requestedAt))
    .limit(input.limit)
    .offset(input.offset);

  const [[countRow], rows] = await Promise.all([countPromise, rowsPromise]);

  return {
    data: rows,
    totalRecords: Number(countRow?.c ?? 0),
  };
}
