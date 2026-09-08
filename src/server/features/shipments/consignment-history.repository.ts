import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { branches, consignments, consignmentItems, customers, parcels } from '@/db/schemas';

export async function listConsignmentHistoryRepo(input: {
  companyId: string;
  sourceId: string | null;
  dateFrom: Date;
  dateTo: Date;
}) {
  const sourceBranch = alias(branches, 'history_source_branch');
  const destinationBranch = alias(branches, 'history_destination_branch');
  const conditions = [
    eq(consignments.companyId, input.companyId),
    gte(consignments.consignmentDate, input.dateFrom),
    lte(consignments.consignmentDate, input.dateTo),
  ];
  if (input.sourceId) conditions.push(eq(consignments.sourceId, input.sourceId));

  const rows = await db
    .select({
      id: consignments.id,
      code: consignments.code,
      sourceId: consignments.sourceId,
      sourceName: sourceBranch.name,
      destinationId: consignments.destinationId,
      destinationName: destinationBranch.name,
      consignmentDate: consignments.consignmentDate,
      createdAt: consignments.createdAt,
      status: consignments.status,
      itemCount: sql<number>`(select count(*) from ${consignmentItems} where ${consignmentItems.consignmentId} = ${consignments.id} and ${consignmentItems.removedAt} is null)`,
    })
    .from(consignments)
    .innerJoin(sourceBranch, eq(sourceBranch.id, consignments.sourceId))
    .innerJoin(destinationBranch, eq(destinationBranch.id, consignments.destinationId))
    .where(and(...conditions))
    .orderBy(desc(consignments.consignmentDate), desc(consignments.serialForDay));

  return rows.map((row) => ({ ...row, itemCount: Number(row.itemCount) }));
}

export async function getConsignmentPrintPayloadRepo(input: {
  consignmentId: string;
  companyId: string;
  sourceId: string | null;
}) {
  const destinationBranch = alias(branches, 'print_destination_branch');
  const sender = alias(customers, 'print_sender');
  const receiver = alias(customers, 'print_receiver');
  const scope = [
    eq(consignments.id, input.consignmentId),
    eq(consignments.companyId, input.companyId),
  ];
  if (input.sourceId) scope.push(eq(consignments.sourceId, input.sourceId));

  const [header] = await db
    .select({
      consignmentCode: consignments.code,
      destinationName: destinationBranch.name,
    })
    .from(consignments)
    .innerJoin(destinationBranch, eq(destinationBranch.id, consignments.destinationId))
    .where(and(...scope))
    .limit(1);
  if (!header) return null;

  const items = await db
    .select({
      id: parcels.id,
      senderName: sender.fullname,
      senderPhone: sender.telephone,
      receiverName: receiver.fullname,
      receiverPhone: receiver.telephone,
      parcelDetails: parcels.parcelDetails,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
    })
    .from(consignmentItems)
    .innerJoin(parcels, eq(parcels.id, consignmentItems.parcelId))
    .innerJoin(sender, eq(sender.id, parcels.senderId))
    .innerJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(
      and(
        eq(consignmentItems.consignmentId, input.consignmentId),
        isNull(consignmentItems.removedAt),
      ),
    )
    .orderBy(consignmentItems.addedAt);

  return { ...header, items };
}
