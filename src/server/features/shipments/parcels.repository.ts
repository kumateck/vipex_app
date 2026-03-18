import { and, asc, count, desc, eq, ilike, isNull, isNotNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { parcels, bookings, customers } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';
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
  search?: string | null; // bookingCode/trackingCode/sender/receiver names/phones
  received?: boolean | null;
  includeDeleted?: boolean | null;
  sort?: SortField[] | null;
};

export async function listParcelsRepo(p: ListParcelsParams): Promise<{
  data: (ParcelRow & {
    bookingCreatedAt: Date | null;
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
  if (p.status != null) whereParts.push(eq(parcels.status, p.status));
  if (p.received === true) whereParts.push(isNotNull(parcels.receivedAt));
  if (p.received === false) whereParts.push(isNull(parcels.receivedAt));
  const s = alias(customers, 's');
  const r = alias(customers, 'r');

  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((srt) => {
          if (srt.field === 'createdAt')
            return srt.direction === 'desc' ? desc(parcels.createdAt) : asc(parcels.createdAt);
          if (srt.field === 'trackingCode')
            return srt.direction === 'desc' ? desc(parcels.trackingCode) : asc(parcels.trackingCode);
          if (srt.field === 'bookingCode')
            return srt.direction === 'desc' ? desc(parcels.bookingCode) : asc(parcels.bookingCode);
          if (srt.field === 'id') return srt.direction === 'desc' ? desc(parcels.id) : asc(parcels.id);
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
      senderName: s.fullname,
      senderPhone: s.telephone,
      receiverName: r.fullname,
      receiverPhone: r.telephone,
    })
    .from(parcels)
    .leftJoin(bookings, eq(parcels.bookingId, bookings.id))
    .leftJoin(s, eq(parcels.senderId, s.id))
    .leftJoin(r, eq(parcels.receiverId, r.id))
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

export async function getParcelRepo(id: string): Promise<ParcelRow | null> {
  const [row] = await db
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
): Promise<{ id: string }> {
  const [row] = await db.insert(parcels).values(values).returning({ id: parcels.id });
  return row ?? { id: '' };
}

export async function updateParcelRepo(
  id: string,
  patch: Partial<typeof parcels.$inferInsert>,
): Promise<{ id: string } | null> {
  const [row] = await db
    .update(parcels)
    .set(patch)
    .where(eq(parcels.id, id))
    .returning({ id: parcels.id });
  return row ?? null;
}
