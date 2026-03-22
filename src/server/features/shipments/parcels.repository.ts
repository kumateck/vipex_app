import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  isNotNull,
  lte,
  or,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  parcels,
  bookings,
  branches,
  customers,
  consignmentItems,
  consignments,
} from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';
type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
export type ParcelRow = {
  id: string;
  companyId: string;
  sourceId: string;
  destinationId: string;
  bookingId: string;
  bookingCode: string;
  trackingCode: string;
  senderId: string;
  receiverId: string;
  secondReceiverId: string | null;
  status: number;
  parcelDetails: string;
  parcelContent: string;
  parcelValuePsw: number;
  chargePsw: number;
  cardId: string | null;
  cardNumber: string | null;
  secondCardId: string | null;
  secondCardNumber: string | null;
  pickupLocationId: string | null;
  plannedToBePaidPsw: number;
  method: number;
  taxReportConfirmation: boolean;
  isDeleted: boolean;
  createdBy: string | null;
  createdAt: Date;
  receivedBy: string | null;
  receivedAt: Date | null;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  updatedAt: Date;
  cashierSessionId: string | null;
};

export type ListParcelsParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  status?: number | null;
  statuses?: number[] | null;
  senderPaid?: boolean | null;
  search?: string | null; // bookingCode/trackingCode/sender/receiver names/phones
  received?: boolean | null;
  includeDeleted?: boolean | null;
  sort?: SortField[] | null;
};

export async function listParcelsRepo(p: ListParcelsParams): Promise<{
  data: (ParcelRow & {
    bookingCreatedAt: Date | null;
    destinationName: string | null;
    consignmentId: string | null;
    consignmentCode: string | null;
    consignmentSerialForDay: number | null;
    senderName: string | null;
    senderPhone: string | null;
    receiverName: string | null;
    receiverPhone: string | null;
  })[];
  totalRecords: number;
}> {
  const whereParts: (
    | ReturnType<typeof eq>
    | ReturnType<typeof and>
    | ReturnType<typeof or>
    | ReturnType<typeof isNull>
    | ReturnType<typeof isNotNull>
  )[] = [];
  if (!p.includeDeleted) whereParts.push(eq(parcels.isDeleted, false));
  if (p.companyId) whereParts.push(eq(parcels.companyId, p.companyId));
  if (p.sourceId) whereParts.push(eq(parcels.sourceId, p.sourceId));
  if (p.destinationId) whereParts.push(eq(parcels.destinationId, p.destinationId));
  if (p.statuses && p.statuses.length > 0) {
    whereParts.push(inArray(parcels.status, p.statuses));
  } else if (p.status != null) {
    whereParts.push(eq(parcels.status, p.status));
  }
  if (p.received === true) whereParts.push(isNotNull(parcels.receivedAt));
  if (p.received === false) whereParts.push(isNull(parcels.receivedAt));
  if (p.senderPaid === true) whereParts.push(lte(parcels.plannedToBePaidPsw, 0));
  if (p.senderPaid === false) whereParts.push(gt(parcels.plannedToBePaidPsw, 0));
  const s = alias(customers, 's');
  const r = alias(customers, 'r');
  const d = alias(branches, 'd');
  const ci = alias(consignmentItems, 'ci');
  const cg = alias(consignments, 'cg');

  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((srt) => {
          if (srt.field === 'createdAt')
            return srt.direction === 'desc' ? desc(parcels.createdAt) : asc(parcels.createdAt);
          if (srt.field === 'trackingCode')
            return srt.direction === 'desc'
              ? desc(parcels.trackingCode)
              : asc(parcels.trackingCode);
          if (srt.field === 'bookingCode')
            return srt.direction === 'desc' ? desc(parcels.bookingCode) : asc(parcels.bookingCode);
          if (srt.field === 'id')
            return srt.direction === 'desc' ? desc(parcels.id) : asc(parcels.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(parcels.createdAt), asc(parcels.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(parcels)
    .leftJoin(bookings, eq(parcels.bookingId, bookings.id))
    .leftJoin(s, eq(parcels.senderId, s.id))
    .leftJoin(r, eq(parcels.receiverId, r.id))
    .leftJoin(d, eq(parcels.destinationId, d.id))
    .where(
      whereParts.length || p.search
        ? and(
            ...(whereParts as [(typeof whereParts)[number], ...(typeof whereParts)[number][]]),
            ...(p.search
              ? [
                  or(
                    ilike(parcels.bookingCode, `%${p.search}%`),
                    ilike(parcels.trackingCode, `%${p.search}%`),
                    ilike(s.fullname, `%${p.search}%`),
                    ilike(s.telephone, `%${p.search}%`),
                    ilike(r.fullname, `%${p.search}%`),
                    ilike(r.telephone, `%${p.search}%`),
                  ),
                ]
              : []),
          )
        : undefined,
    );
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      bookingId: parcels.bookingId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      senderId: parcels.senderId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
      status: parcels.status,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      parcelValuePsw: parcels.parcelValuePsw,
      chargePsw: parcels.chargePsw,
      cardId: parcels.cardId,
      cardNumber: parcels.cardNumber,
      secondCardId: parcels.secondCardId,
      secondCardNumber: parcels.secondCardNumber,
      pickupLocationId: parcels.pickupLocationId,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      taxReportConfirmation: parcels.taxReportConfirmation,
      isDeleted: parcels.isDeleted,
      createdBy: parcels.createdBy,
      createdAt: parcels.createdAt,
      receivedBy: parcels.receivedBy,
      receivedAt: parcels.receivedAt,
      confirmedBy: parcels.confirmedBy,
      confirmedAt: parcels.confirmedAt,
      updatedAt: parcels.updatedAt,
      cashierSessionId: parcels.cashierSessionId,
      bookingCreatedAt: bookings.createdAt,
      destinationName: d.name,
      consignmentId: cg.id,
      consignmentCode: cg.code,
      consignmentSerialForDay: cg.serialForDay,
      senderName: s.fullname,
      senderPhone: s.telephone,
      receiverName: r.fullname,
      receiverPhone: r.telephone,
    })
    .from(parcels)
    .leftJoin(bookings, eq(parcels.bookingId, bookings.id))
    .leftJoin(s, eq(parcels.senderId, s.id))
    .leftJoin(r, eq(parcels.receiverId, r.id))
    .leftJoin(d, eq(parcels.destinationId, d.id))
    .leftJoin(ci, and(eq(ci.parcelId, parcels.id), isNull(ci.removedAt)))
    .leftJoin(cg, eq(cg.id, ci.consignmentId))
    .where(
      whereParts.length || p.search
        ? and(
            ...(whereParts as [(typeof whereParts)[number], ...(typeof whereParts)[number][]]),
            ...(p.search
              ? [
                  or(
                    ilike(parcels.bookingCode, `%${p.search}%`),
                    ilike(parcels.trackingCode, `%${p.search}%`),
                    ilike(s.fullname, `%${p.search}%`),
                    ilike(s.telephone, `%${p.search}%`),
                    ilike(r.fullname, `%${p.search}%`),
                    ilike(r.telephone, `%${p.search}%`),
                  ),
                ]
              : []),
          )
        : undefined,
    )
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getParcelRepo(
  id: string,
  executor: DbExecutor = db,
): Promise<ParcelRow | null> {
  const [row] = await executor
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      bookingId: parcels.bookingId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      senderId: parcels.senderId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
      status: parcels.status,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      parcelValuePsw: parcels.parcelValuePsw,
      chargePsw: parcels.chargePsw,
      cardId: parcels.cardId,
      cardNumber: parcels.cardNumber,
      secondCardId: parcels.secondCardId,
      secondCardNumber: parcels.secondCardNumber,
      pickupLocationId: parcels.pickupLocationId,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      taxReportConfirmation: parcels.taxReportConfirmation,
      isDeleted: parcels.isDeleted,
      createdBy: parcels.createdBy,
      createdAt: parcels.createdAt,
      receivedBy: parcels.receivedBy,
      receivedAt: parcels.receivedAt,
      confirmedBy: parcels.confirmedBy,
      confirmedAt: parcels.confirmedAt,
      updatedAt: parcels.updatedAt,
      cashierSessionId: parcels.cashierSessionId,
    })
    .from(parcels)
    .where(eq(parcels.id, id))
    .limit(1);
  return row ?? null;
}

export async function createParcelRepo(
  values: typeof parcels.$inferInsert,
  executor: DbExecutor = db,
): Promise<{ id: string }> {
  const [row] = await executor.insert(parcels).values(values).returning({ id: parcels.id });
  return row ?? { id: '' };
}

export async function updateParcelRepo(
  id: string,
  patch: Partial<typeof parcels.$inferInsert>,
  executor: DbExecutor = db,
): Promise<{ id: string } | null> {
  const [row] = await executor
    .update(parcels)
    .set(patch)
    .where(eq(parcels.id, id))
    .returning({ id: parcels.id });
  return row ?? null;
}

export async function updateParcelsStatusRepo(
  parcelIds: string[],
  status: number,
): Promise<number> {
  if (parcelIds.length === 0) return 0;

  const rows = await db
    .update(parcels)
    .set({ status })
    .where(inArray(parcels.id, parcelIds))
    .returning({ id: parcels.id });

  return rows.length;
}
