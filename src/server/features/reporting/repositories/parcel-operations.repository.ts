import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  branches,
  customers,
  parcels,
  parcelStickerPrints,
  parcelStorageWaivers,
  users,
} from '@/db/schemas';

export async function listParcelStatusReportRowsRepo(input: {
  companyId: string;
  from?: Date | null;
  to?: Date | null;
  branchId?: string | null;
}) {
  const sender = alias(customers, 'status_report_sender');
  const receiver = alias(customers, 'status_report_receiver');
  return db
    .select({
      id: parcels.id,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      status: parcels.status,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      sourceBranchId: parcels.sourceId,
      sourceBranchName: sourceBranch.name,
      destinationBranchId: parcels.destinationId,
      destinationBranchName: destinationBranch.name,
      senderName: sql<string>`coalesce(nullif(btrim(${parcels.senderNameSnapshot}), ''), ${sender.fullname}, '')`,
      receiverName: sql<string>`coalesce(nullif(btrim(${parcels.receiverNameSnapshot}), ''), ${receiver.fullname}, '')`,
      createdAt: parcels.createdAt,
      receivedAt: parcels.receivedAt,
    })
    .from(parcels)
    .leftJoin(sender, eq(sender.id, parcels.senderId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .leftJoin(sourceBranch, eq(sourceBranch.id, parcels.sourceId))
    .leftJoin(destinationBranch, eq(destinationBranch.id, parcels.destinationId))
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(parcels.isDeleted, false),
        ...(input.from ? [gte(parcels.createdAt, input.from)] : []),
        ...(input.to ? [lte(parcels.createdAt, input.to)] : []),
        ...(input.branchId
          ? [or(eq(parcels.sourceId, input.branchId), eq(parcels.destinationId, input.branchId))!]
          : []),
      ),
    )
    .orderBy(desc(parcels.createdAt), desc(parcels.id));
}

export async function listStickerPrintUsageReportRowsRepo(input: {
  companyId: string;
  from?: Date | null;
  to?: Date | null;
  branchId?: string | null;
}) {
  return db
    .select({
      id: parcelStickerPrints.id,
      bookingCode: parcelStickerPrints.bookingCode,
      trackingCode: parcelStickerPrints.trackingCode,
      copies: parcelStickerPrints.copies,
      branchId: parcelStickerPrints.branchId,
      branchName: branches.name,
      printedByName: users.fullname,
      printedAt: parcelStickerPrints.printedAt,
    })
    .from(parcelStickerPrints)
    .leftJoin(branches, eq(branches.id, parcelStickerPrints.branchId))
    .leftJoin(users, eq(users.id, parcelStickerPrints.printedBy))
    .where(
      and(
        eq(parcelStickerPrints.companyId, input.companyId),
        ...(input.from ? [gte(parcelStickerPrints.printedAt, input.from)] : []),
        ...(input.to ? [lte(parcelStickerPrints.printedAt, input.to)] : []),
        ...(input.branchId ? [eq(parcelStickerPrints.branchId, input.branchId)] : []),
      ),
    )
    .orderBy(desc(parcelStickerPrints.printedAt));
}

export async function listStorageWaiverFinancialReportRowsRepo(input: {
  companyId: string;
  from: Date;
  to: Date;
  branchId?: string | null;
}) {
  const waivedBy = alias(users, 'report_storage_waived_by');
  const destination = alias(branches, 'report_storage_destination');

  return db
    .select({
      waiverId: parcelStorageWaivers.id,
      parcelId: parcelStorageWaivers.parcelId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      destinationBranchId: parcels.destinationId,
      destinationBranchName: destination.name,
      waivedAmountPsw: parcelStorageWaivers.waivedAmountPsw,
      reason: parcelStorageWaivers.reason,
      waivedByUserId: parcelStorageWaivers.waivedBy,
      waivedByName: waivedBy.fullname,
      waivedAt: parcelStorageWaivers.waivedAt,
      accountingJournalEntryId: parcelStorageWaivers.accountingJournalEntryId,
      accountingPostedAt: parcelStorageWaivers.accountingPostedAt,
    })
    .from(parcelStorageWaivers)
    .innerJoin(parcels, eq(parcels.id, parcelStorageWaivers.parcelId))
    .leftJoin(waivedBy, eq(waivedBy.id, parcelStorageWaivers.waivedBy))
    .leftJoin(destination, eq(destination.id, parcels.destinationId))
    .where(
      and(
        eq(parcelStorageWaivers.companyId, input.companyId),
        gte(parcelStorageWaivers.waivedAt, input.from),
        lte(parcelStorageWaivers.waivedAt, input.to),
        ...(input.branchId ? [eq(parcels.destinationId, input.branchId)] : []),
      ),
    )
    .orderBy(desc(parcelStorageWaivers.waivedAt), desc(parcelStorageWaivers.id));
}

const sourceBranch = alias(branches, 'report_parcel_source_branch');
const destinationBranch = alias(branches, 'report_parcel_destination_branch');
