import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  branches,
  deliveries,
  customers,
  chartOfAccounts,
  journalBatches,
  journalEntries,
  journalLines,
  parcels,
  users,
} from '@/db/schemas';

export async function listJournalLinesForBatchDetailedRepo(batchId: string) {
  return db
    .select({
      lineId: journalLines.id,
      entryId: journalEntries.id,
      batchId: journalEntries.batchId,
      entryDate: journalEntries.entryDate,
      memo: journalEntries.memo,
      accountId: chartOfAccounts.id,
      accountCode: chartOfAccounts.code,
      accountName: chartOfAccounts.name,
      branchId: journalLines.branchId,
      branchName: branches.name,
      debitPsw: journalLines.debitPsw,
      creditPsw: journalLines.creditPsw,
      description: journalLines.description,
      metadata: journalLines.metadata,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalEntries.id, journalLines.entryId))
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalLines.accountId))
    .leftJoin(branches, eq(branches.id, journalLines.branchId))
    .where(eq(journalEntries.batchId, batchId))
    .orderBy(asc(journalEntries.entryDate), asc(journalEntries.id), asc(journalLines.id));
}

export async function getJournalBatchReportMetaRepo(batchId: string) {
  const postedByUser = alias(users, 'report_journal_batch_posted_by');

  const [row] = await db
    .select({
      id: journalBatches.id,
      sourceType: journalBatches.sourceType,
      sourceId: journalBatches.sourceId,
      batchDate: journalBatches.batchDate,
      description: journalBatches.description,
      postedAt: journalBatches.postedAt,
      postedBy: journalBatches.postedBy,
      postedByName: postedByUser.fullname,
    })
    .from(journalBatches)
    .leftJoin(postedByUser, eq(postedByUser.id, journalBatches.postedBy))
    .where(eq(journalBatches.id, batchId))
    .limit(1);

  return row ?? null;
}

export async function listDeliveryPerformanceReportRowsRepo(input: {
  companyId: string;
  branchId?: string | null;
  riderUserId?: string | null;
  from: Date;
  to: Date;
}) {
  const receiver = alias(customers, 'report_delivery_receiver');
  const destinationBranch = alias(branches, 'report_delivery_destination_branch');
  const rider = alias(users, 'report_delivery_rider');

  return db
    .select({
      deliveryId: deliveries.id,
      parcelId: deliveries.parcelId,
      mode: deliveries.mode,
      deliveryStatus: deliveries.status,
      parcelStatus: parcels.status,
      riderUserId: deliveries.riderUserId,
      riderName: rider.fullname,
      destinationBranchId: parcels.destinationId,
      destinationBranchName: destinationBranch.name,
      receiverName: sql<string>`coalesce(nullif(btrim(${parcels.receiverNameSnapshot}), ''), ${receiver.fullname}, '')`,
      receiverPhone: receiver.telephone,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      deliveryFeePsw: deliveries.chargePsw,
      amountPaidPsw: deliveries.amountPaidPsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      dropoffAddress: deliveries.dropoffAddress,
      deliveredAt: deliveries.deliveredAt,
      createdAt: deliveries.createdAt,
      updatedAt: deliveries.updatedAt,
    })
    .from(deliveries)
    .innerJoin(parcels, eq(parcels.id, deliveries.parcelId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .leftJoin(destinationBranch, eq(destinationBranch.id, parcels.destinationId))
    .leftJoin(rider, eq(rider.id, deliveries.riderUserId))
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(deliveries.isDeleted, false),
        gte(deliveries.createdAt, input.from),
        lte(deliveries.createdAt, input.to),
        ...(input.branchId ? [eq(parcels.destinationId, input.branchId)] : []),
        ...(input.riderUserId ? [eq(deliveries.riderUserId, input.riderUserId)] : []),
      ),
    )
    .orderBy(desc(deliveries.updatedAt), asc(deliveries.id));
}
