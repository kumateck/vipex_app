import { and, count, desc, eq, inArray, isNull, max, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  branches,
  consignments,
  consignmentItems,
  customers,
  parcels,
  users,
  ConsignmentReceivingStatus,
} from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type ConsignmentRow = {
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
};

export async function getNextSerialForDayRepo(
  companyId: string,
  sourceId: string,
  consignmentDate: Date,
): Promise<number> {
  const [r] = await db
    .select({ m: max(consignments.serialForDay).as('m') })
    .from(consignments)
    .where(
      and(
        eq(consignments.companyId, companyId),
        eq(consignments.sourceId, sourceId),
        eq(consignments.consignmentDate, consignmentDate),
      ),
    );
  const currentMax = (r?.m as number | null) ?? 0;
  return (currentMax ?? 0) + 1;
}

export async function createConsignmentRepo(
  values: typeof consignments.$inferInsert,
): Promise<{ id: string }> {
  const [row] = await db.insert(consignments).values(values).returning({ id: consignments.id });
  if (!row) {
    throw new Error('Failed to create consignment');
  }
  return row;
}

export async function getConsignmentRepo(id: string): Promise<ConsignmentRow | null> {
  const [row] = await db.select().from(consignments).where(eq(consignments.id, id)).limit(1);
  return row ?? null;
}

export type ConsignmentItemRow = {
  consignmentId: string;
  parcelId: string;
  addedAt: Date;
  removedAt: Date | null;
};

export type ParcelConsignmentRow = {
  consignmentId: string;
  code: string;
  consignmentDate: Date;
  serialForDay: number;
  sourceId: string;
  destinationId: string;
  addedAt: Date;
  removedAt: Date | null;
};

export async function addConsignmentItemsRepo(
  items: { consignmentId: string; parcelId: string }[],
): Promise<number> {
  if (items.length === 0) return 0;
  const rows = await db
    .insert(consignmentItems)
    .values(items.map((i) => ({ consignmentId: i.consignmentId, parcelId: i.parcelId })))
    .returning({ consignmentId: consignmentItems.consignmentId });
  return rows.length;
}

export async function removeConsignmentItemRepo(
  consignmentId: string,
  parcelId: string,
  removedAt: Date,
): Promise<number> {
  const rows = await db
    .update(consignmentItems)
    .set({ removedAt })
    .where(
      and(
        eq(consignmentItems.consignmentId, consignmentId),
        eq(consignmentItems.parcelId, parcelId),
        isNull(consignmentItems.removedAt),
      ),
    )
    .returning({ parcelId: consignmentItems.parcelId });
  return rows.length;
}

export async function removeActiveConsignmentItemsByParcelRepo(
  parcelId: string,
  removedAt: Date,
): Promise<number> {
  const rows = await db
    .update(consignmentItems)
    .set({ removedAt })
    .where(and(eq(consignmentItems.parcelId, parcelId), isNull(consignmentItems.removedAt)))
    .returning({ parcelId: consignmentItems.parcelId });
  return rows.length;
}

export async function listConsignmentsForParcelRepo(
  parcelId: string,
): Promise<ParcelConsignmentRow[]> {
  const rows = await db
    .select({
      consignmentId: consignmentItems.consignmentId,
      code: consignments.code,
      consignmentDate: consignments.consignmentDate,
      serialForDay: consignments.serialForDay,
      sourceId: consignments.sourceId,
      destinationId: consignments.destinationId,
      addedAt: consignmentItems.addedAt,
      removedAt: consignmentItems.removedAt,
    })
    .from(consignmentItems)
    .innerJoin(consignments, eq(consignments.id, consignmentItems.consignmentId))
    .where(eq(consignmentItems.parcelId, parcelId));
  return rows;
}

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

  const rows = await db
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

  return rows;
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

export type IncomingConsignmentRow = ConsignmentRow & {
  sourceName: string;
  arrived: number;
  total: number;
};

export async function listIncomingConsignmentsRepo(p: {
  companyId: string;
  destinationId: string;
  statuses?: number[];
}): Promise<IncomingConsignmentRow[]> {
  const sourceBranch = alias(branches, 'consignment_source_branch');
  const conditions = [
    eq(consignments.companyId, p.companyId),
    eq(consignments.destinationId, p.destinationId),
  ];
  if (p.statuses && p.statuses.length > 0) {
    conditions.push(inArray(consignments.status, p.statuses));
  }

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

  return rows.map((r) => ({ ...r, arrived: Number(r.arrived), total: Number(r.total) }));
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
