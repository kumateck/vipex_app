import { and, asc, eq, gt, ilike, isNull, isNotNull, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, bookings, customers } from '@/db/schemas';
import { type CursorKey } from '@/server/utils/cursor';
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
  statusId: string;
  parcelDetails: string;
  parcelContent: string;
  parcelValuePsw: bigint;
  cardId: string | null;
  cardNumber: string | null;
  secondCardId: string | null;
  secondCardNumber: string | null;
  pickupLocationId: string | null;
  plannedToBePaidPsw: bigint;
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
  after?: CursorKey | null;
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  statusId?: string | null;
  search?: string | null; // bookingCode/trackingCode/sender/receiver names/phones
  received?: boolean | null;
  includeDeleted?: boolean | null;
};

export async function listParcelsRepo(p: ListParcelsParams): Promise<{
  data: (ParcelRow & {
    bookingCreatedAt: Date | null;
    senderName: string | null;
    senderPhone: string | null;
    receiverName: string | null;
    receiverPhone: string | null;
  })[];
  nextCursor: CursorKey | null;
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
  if (p.statusId) whereParts.push(eq(parcels.statusId, p.statusId));
  if (p.received === true) whereParts.push(isNotNull(parcels.receivedAt));
  if (p.received === false) whereParts.push(isNull(parcels.receivedAt));
  if (p.after) {
    whereParts.push(
      or(
        gt(parcels.createdAt, new Date(p.after.createdAt)),
        and(eq(parcels.createdAt, new Date(p.after.createdAt)), gt(parcels.id, p.after.id)),
      ),
    );
  }

  const s = customers.as('s');
  const r = customers.as('r');

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
      statusId: parcels.statusId,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      parcelValuePsw: parcels.parcelValuePsw,
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
    .orderBy(asc(parcels.createdAt), asc(parcels.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
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
      statusId: parcels.statusId,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      parcelValuePsw: parcels.parcelValuePsw,
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
  return row;
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
