import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  consignments,
  consignmentItems,
  branches,
  customers,
  parcels,
  users,
  ConsignmentReceivingStatus,
} from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type ConsignmentItemDetailRow = {
  parcelId: string;
  trackingCode: string;
  bookingCode: string;
  parcelDetails: string;
  senderName: string;
  receiverName: string;
  addedAt: Date;
  arrivedAt: Date | null;
  arrivedBy: string | null;
  arrivedByName: string | null;
};

export async function listConsignmentItemsRepo(
  consignmentId: string,
): Promise<ConsignmentItemDetailRow[]> {
  const arrivedByUser = sql<
    string | null
  >`(select ${users.fullname} from ${users} where ${users.id} = ${consignmentItems.arrivedBy})`;
  const senderCustomer = sql<string>`(select ${customers.fullname} from ${customers} where ${customers.id} = ${parcels.senderId})`;
  const receiverCustomer = sql<string>`(select ${customers.fullname} from ${customers} where ${customers.id} = ${parcels.receiverId})`;

  return db
    .select({
      parcelId: consignmentItems.parcelId,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      parcelDetails: parcels.parcelDetails,
      senderName: senderCustomer,
      receiverName: receiverCustomer,
      addedAt: consignmentItems.addedAt,
      arrivedAt: consignmentItems.arrivedAt,
      arrivedBy: consignmentItems.arrivedBy,
      arrivedByName: arrivedByUser,
    })
    .from(consignmentItems)
    .innerJoin(parcels, eq(parcels.id, consignmentItems.parcelId))
    .where(
      and(eq(consignmentItems.consignmentId, consignmentId), isNull(consignmentItems.removedAt)),
    )
    .orderBy(desc(consignmentItems.addedAt));
}

export async function getConsignmentReceivingCountsRepo(
  consignmentId: string,
): Promise<{ arrived: number; total: number }> {
  const [row] = await db
    .select({
      total: count(),
      arrived: sql<number>`count(*) filter (where ${consignmentItems.arrivedAt} is not null)`,
    })
    .from(consignmentItems)
    .where(
      and(eq(consignmentItems.consignmentId, consignmentId), isNull(consignmentItems.removedAt)),
    );

  return { arrived: Number(row?.arrived ?? 0), total: Number(row?.total ?? 0) };
}

export async function markConsignmentItemArrivedRepo(
  consignmentId: string,
  parcelId: string,
  arrivedBy: string,
  arrivedAt: Date,
  executor: DbExecutor = db,
): Promise<boolean> {
  const rows = await executor
    .update(consignmentItems)
    .set({ arrivedAt, arrivedBy })
    .where(
      and(
        eq(consignmentItems.consignmentId, consignmentId),
        eq(consignmentItems.parcelId, parcelId),
        isNull(consignmentItems.removedAt),
        isNull(consignmentItems.arrivedAt),
      ),
    )
    .returning({ parcelId: consignmentItems.parcelId });
  return rows.length > 0;
}

export async function getConsignmentItemRepo(
  consignmentId: string,
  parcelId: string,
  executor: DbExecutor = db,
): Promise<{
  arrivedAt: Date | null;
  arrivedBy: string | null;
  arrivedByName: string | null;
} | null> {
  const arrivedByUser = sql<
    string | null
  >`(select ${users.fullname} from ${users} where ${users.id} = ${consignmentItems.arrivedBy})`;
  const [row] = await executor
    .select({
      arrivedAt: consignmentItems.arrivedAt,
      arrivedBy: consignmentItems.arrivedBy,
      arrivedByName: arrivedByUser,
    })
    .from(consignmentItems)
    .where(
      and(
        eq(consignmentItems.consignmentId, consignmentId),
        eq(consignmentItems.parcelId, parcelId),
        isNull(consignmentItems.removedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function closeConsignmentRepo(
  consignmentId: string,
  patch: {
    status: number;
    closedBy: string;
    closedAt: Date;
    closedWithExceptions: boolean;
    closeExceptionReason: string | null;
  },
  executor: DbExecutor = db,
): Promise<{ id: string } | null> {
  const [row] = await executor
    .update(consignments)
    .set(patch)
    .where(
      and(
        eq(consignments.id, consignmentId),
        eq(consignments.status, ConsignmentReceivingStatus.OPEN),
      ),
    )
    .returning({ id: consignments.id });
  return row ?? null;
}

export type IncomingConsignmentRow = {
  id: string;
  companyId: string;
  sourceId: string;
  destinationId: string;
  consignmentDate: Date;
  serialForDay: number;
  code: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: number;
  closedBy: string | null;
  closedAt: Date | null;
  closedWithExceptions: boolean;
  closeExceptionReason: string | null;
  sourceName: string;
  arrived: number;
  total: number;
};

export async function listIncomingConsignmentsRepo(input: {
  companyId: string;
  destinationId: string;
  statuses?: number[];
}): Promise<IncomingConsignmentRow[]> {
  const sourceBranch = alias(branches, 'consignment_source_branch');
  const conditions = [
    eq(consignments.companyId, input.companyId),
    eq(consignments.destinationId, input.destinationId),
  ];
  if (input.statuses?.length) conditions.push(inArray(consignments.status, input.statuses));

  const rows = await db
    .select({
      id: consignments.id,
      companyId: consignments.companyId,
      sourceId: consignments.sourceId,
      destinationId: consignments.destinationId,
      consignmentDate: consignments.consignmentDate,
      serialForDay: consignments.serialForDay,
      code: consignments.code,
      createdBy: consignments.createdBy,
      createdAt: consignments.createdAt,
      updatedAt: consignments.updatedAt,
      status: consignments.status,
      closedBy: consignments.closedBy,
      closedAt: consignments.closedAt,
      closedWithExceptions: consignments.closedWithExceptions,
      closeExceptionReason: consignments.closeExceptionReason,
      sourceName: sourceBranch.name,
      total: sql<number>`(select count(*) from ${consignmentItems} where ${consignmentItems.consignmentId} = ${consignments.id} and ${consignmentItems.removedAt} is null)`,
      arrived: sql<number>`(select count(*) from ${consignmentItems} where ${consignmentItems.consignmentId} = ${consignments.id} and ${consignmentItems.removedAt} is null and ${consignmentItems.arrivedAt} is not null)`,
    })
    .from(consignments)
    .innerJoin(sourceBranch, eq(sourceBranch.id, consignments.sourceId))
    .where(and(...conditions))
    .orderBy(desc(consignments.consignmentDate), desc(consignments.serialForDay));

  return rows.map((row) => ({ ...row, arrived: Number(row.arrived), total: Number(row.total) }));
}
