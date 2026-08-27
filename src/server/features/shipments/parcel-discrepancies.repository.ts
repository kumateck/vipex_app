import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { branches, customers, locations, parcelDiscrepancies, parcels, users } from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function createParcelDiscrepancyRepo(
  input: typeof parcelDiscrepancies.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(parcelDiscrepancies)
    .values(input)
    .returning({ id: parcelDiscrepancies.id });
  return row ?? null;
}

export async function getOpenDiscrepancyByParcelRepo(parcelId: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select({ id: parcelDiscrepancies.id })
    .from(parcelDiscrepancies)
    .where(and(eq(parcelDiscrepancies.parcelId, parcelId), eq(parcelDiscrepancies.status, 0)))
    .limit(1);
  return row ?? null;
}

export async function getParcelDiscrepancyRepo(id: string, companyId: string) {
  const [row] = await db
    .select({ id: parcelDiscrepancies.id })
    .from(parcelDiscrepancies)
    .where(and(eq(parcelDiscrepancies.id, id), eq(parcelDiscrepancies.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function resolveParcelDiscrepancyRepo(
  id: string,
  companyId: string,
  patch: {
    resolvedBy: string;
    resolvedAt: Date;
    resolutionNote: string | null;
  },
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(parcelDiscrepancies)
    .set({
      status: 1,
      resolvedBy: patch.resolvedBy,
      resolvedAt: patch.resolvedAt,
      resolutionNote: patch.resolutionNote,
    })
    .where(
      and(
        eq(parcelDiscrepancies.id, id),
        eq(parcelDiscrepancies.companyId, companyId),
        eq(parcelDiscrepancies.status, 0),
      ),
    )
    .returning({
      id: parcelDiscrepancies.id,
      parcelId: parcelDiscrepancies.parcelId,
      companyId: parcelDiscrepancies.companyId,
      trackingCode: parcelDiscrepancies.trackingCode,
      bookingCode: parcelDiscrepancies.bookingCode,
    });
  return row ?? null;
}

export async function listOpenParcelDiscrepanciesRepo(input: {
  companyId: string;
  branchId?: string | null;
  limit: number;
  offset: number;
  search?: string | null;
}) {
  const creator = alias(users, 'creator');
  const branch = alias(branches, 'b');
  const destinationLocation = alias(locations, 'dl');
  const sender = alias(customers, 's');
  const receiver = alias(customers, 'r');

  const where = and(
    eq(parcelDiscrepancies.companyId, input.companyId),
    eq(parcelDiscrepancies.status, 0),
    input.branchId ? eq(parcelDiscrepancies.branchId, input.branchId) : undefined,
    input.search
      ? or(
          ilike(parcelDiscrepancies.trackingCode, `%${input.search}%`),
          ilike(parcelDiscrepancies.bookingCode, `%${input.search}%`),
          ilike(parcelDiscrepancies.notes, `%${input.search}%`),
        )
      : undefined,
  );

  const [countRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(parcelDiscrepancies)
    .where(where);

  const rows = await db
    .select({
      id: parcelDiscrepancies.id,
      parcelId: parcelDiscrepancies.parcelId,
      branchId: parcelDiscrepancies.branchId,
      branchName: branch.name,
      trackingCode: parcelDiscrepancies.trackingCode,
      bookingCode: parcelDiscrepancies.bookingCode,
      discrepancyType: parcelDiscrepancies.discrepancyType,
      notes: parcelDiscrepancies.notes,
      createdBy: parcelDiscrepancies.createdBy,
      createdByName: creator.fullname,
      createdAt: parcelDiscrepancies.createdAt,
      parcelStatus: parcels.status,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      pickupLocationId: parcels.pickupLocationId,
      destinationLocationName: destinationLocation.name,
      senderName: sender.fullname,
      receiverName: receiver.fullname,
    })
    .from(parcelDiscrepancies)
    .leftJoin(parcels, eq(parcelDiscrepancies.parcelId, parcels.id))
    .leftJoin(branch, eq(parcelDiscrepancies.branchId, branch.id))
    .leftJoin(creator, eq(parcelDiscrepancies.createdBy, creator.id))
    .leftJoin(sender, eq(parcels.senderId, sender.id))
    .leftJoin(receiver, eq(parcels.receiverId, receiver.id))
    .leftJoin(destinationLocation, eq(parcels.pickupLocationId, destinationLocation.id))
    .where(where)
    .orderBy(desc(parcelDiscrepancies.createdAt))
    .limit(input.limit)
    .offset(input.offset);

  return {
    data: rows,
    totalRecords: Number(countRow?.c ?? 0),
  };
}
