import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { customers, parcelStorageClearanceRequests, parcels, users } from '@/db/schemas';
import { ParcelStorageClearanceStatus } from '@/db/schemas/enums';

export type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function createParcelStorageClearanceRepo(
  input: typeof parcelStorageClearanceRequests.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(parcelStorageClearanceRequests)
    .values(input)
    .returning({ id: parcelStorageClearanceRequests.id });
  return row ?? null;
}

export async function getParcelStorageClearanceRepo(
  id: string,
  executor: DbExecutor = db,
  lock = false,
) {
  const query = executor
    .select()
    .from(parcelStorageClearanceRequests)
    .where(eq(parcelStorageClearanceRequests.id, id))
    .limit(1);
  const [row] = await (lock ? query.for('update') : query);
  return row ?? null;
}

export async function lockStorageClearanceParcelRepo(id: string, executor: DbExecutor) {
  await executor.select({ id: parcels.id }).from(parcels).where(eq(parcels.id, id)).for('update');
}

export async function getOpenParcelStorageClearanceRepo(
  parcelId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({ id: parcelStorageClearanceRequests.id })
    .from(parcelStorageClearanceRequests)
    .where(
      and(
        eq(parcelStorageClearanceRequests.parcelId, parcelId),
        inArray(parcelStorageClearanceRequests.status, [
          ParcelStorageClearanceStatus.PENDING_APPROVAL,
          ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE,
          ParcelStorageClearanceStatus.RETURNED_FOR_REVIEW,
        ]),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateParcelStorageClearanceRepo(
  id: string,
  patch: Partial<typeof parcelStorageClearanceRequests.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(parcelStorageClearanceRequests)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(parcelStorageClearanceRequests.id, id))
    .returning({ id: parcelStorageClearanceRequests.id });
  return row ?? null;
}

export async function listParcelStorageClearancesRepo(input: {
  companyId: string;
  statuses?: number[] | null;
  branchId?: string | null;
  search?: string | null;
  limit: number;
  offset: number;
}) {
  const requester = alias(users, 'storage_clearance_requester');
  const approver = alias(users, 'storage_clearance_approver');
  const returnedBy = alias(users, 'storage_clearance_returned_by');
  const rejectedBy = alias(users, 'storage_clearance_rejected_by');
  const executorUser = alias(users, 'storage_clearance_executor');
  const sender = alias(customers, 'storage_clearance_sender');
  const receiver = alias(customers, 'storage_clearance_receiver');
  const where = and(
    eq(parcelStorageClearanceRequests.companyId, input.companyId),
    input.statuses?.length
      ? inArray(parcelStorageClearanceRequests.status, input.statuses)
      : undefined,
    input.branchId
      ? or(eq(parcels.sourceId, input.branchId), eq(parcels.destinationId, input.branchId))
      : undefined,
    input.search
      ? or(
          ilike(parcels.bookingCode, `%${input.search}%`),
          ilike(parcels.trackingCode, `%${input.search}%`),
          ilike(sender.telephone, `%${input.search}%`),
          ilike(receiver.telephone, `%${input.search}%`),
          ilike(parcelStorageClearanceRequests.reason, `%${input.search}%`),
        )
      : undefined,
  );

  const countPromise = db
    .select({ count: sql<number>`count(*)` })
    .from(parcelStorageClearanceRequests)
    .innerJoin(parcels, eq(parcelStorageClearanceRequests.parcelId, parcels.id))
    .leftJoin(sender, eq(parcels.senderId, sender.id))
    .leftJoin(receiver, eq(parcels.receiverId, receiver.id))
    .where(where);

  const rowsPromise = db
    .select({
      id: parcelStorageClearanceRequests.id,
      companyId: parcelStorageClearanceRequests.companyId,
      parcelId: parcelStorageClearanceRequests.parcelId,
      status: parcelStorageClearanceRequests.status,
      requestedDays: parcelStorageClearanceRequests.requestedDays,
      accruedDaysAtRequest: parcelStorageClearanceRequests.accruedDaysAtRequest,
      dailyRatePsw: parcelStorageClearanceRequests.dailyRatePsw,
      requestedAmountPsw: parcelStorageClearanceRequests.requestedAmountPsw,
      clearAll: parcelStorageClearanceRequests.clearAll,
      reason: parcelStorageClearanceRequests.reason,
      evidenceUrl: parcelStorageClearanceRequests.evidenceUrl,
      requestedBy: parcelStorageClearanceRequests.requestedBy,
      requestedAt: parcelStorageClearanceRequests.requestedAt,
      requestedByName: requester.fullname,
      approvedBy: parcelStorageClearanceRequests.approvedBy,
      approvedByName: approver.fullname,
      approvedAt: parcelStorageClearanceRequests.approvedAt,
      approvalNote: parcelStorageClearanceRequests.approvalNote,
      returnedBy: parcelStorageClearanceRequests.returnedBy,
      returnedByName: returnedBy.fullname,
      returnedAt: parcelStorageClearanceRequests.returnedAt,
      returnNote: parcelStorageClearanceRequests.returnNote,
      rejectedBy: parcelStorageClearanceRequests.rejectedBy,
      rejectedByName: rejectedBy.fullname,
      rejectedAt: parcelStorageClearanceRequests.rejectedAt,
      rejectionNote: parcelStorageClearanceRequests.rejectionNote,
      executedBy: parcelStorageClearanceRequests.executedBy,
      executedByName: executorUser.fullname,
      executedAt: parcelStorageClearanceRequests.executedAt,
      executedDays: parcelStorageClearanceRequests.executedDays,
      executedAmountPsw: parcelStorageClearanceRequests.executedAmountPsw,
      accountingJournalEntryId: parcelStorageClearanceRequests.accountingJournalEntryId,
      accountingPostedAt: parcelStorageClearanceRequests.accountingPostedAt,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      parcelStatus: parcels.status,
      senderName: parcels.senderNameSnapshot,
      receiverName: parcels.receiverNameSnapshot,
    })
    .from(parcelStorageClearanceRequests)
    .innerJoin(parcels, eq(parcelStorageClearanceRequests.parcelId, parcels.id))
    .leftJoin(sender, eq(parcels.senderId, sender.id))
    .leftJoin(receiver, eq(parcels.receiverId, receiver.id))
    .leftJoin(requester, eq(parcelStorageClearanceRequests.requestedBy, requester.id))
    .leftJoin(approver, eq(parcelStorageClearanceRequests.approvedBy, approver.id))
    .leftJoin(returnedBy, eq(parcelStorageClearanceRequests.returnedBy, returnedBy.id))
    .leftJoin(rejectedBy, eq(parcelStorageClearanceRequests.rejectedBy, rejectedBy.id))
    .leftJoin(executorUser, eq(parcelStorageClearanceRequests.executedBy, executorUser.id))
    .where(where)
    .orderBy(
      desc(parcelStorageClearanceRequests.requestedAt),
      desc(parcelStorageClearanceRequests.id),
    )
    .limit(input.limit)
    .offset(input.offset);

  const [countRows, data] = await Promise.all([countPromise, rowsPromise]);
  return { data, totalRecords: Number(countRows[0]?.count ?? 0) };
}
