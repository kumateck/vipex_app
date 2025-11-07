import { and, asc, count, eq, gt, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { bookings, parcels } from '@/db/schemas';
import { type CursorKey } from '@/server/utils/cursor';

export type BookingRow = {
  id: string;
  senderId: string;
  companyId: string;
  sourceId: string;
  statusId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cashierSessionId: string | null;
};

export type ListBookingsParams = {
  limit: number;
  after?: CursorKey | null;
  companyId?: string | null;
  senderId?: string | null;
  sourceId?: string | null;
};

export async function listBookingsRepo(
  p: ListBookingsParams,
): Promise<{ data: BookingRow[]; nextCursor: CursorKey | null }> {
  const whereParts: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [];
  if (p.companyId) whereParts.push(eq(bookings.companyId, p.companyId));
  if (p.senderId) whereParts.push(eq(bookings.senderId, p.senderId));
  if (p.sourceId) whereParts.push(eq(bookings.sourceId, p.sourceId));
  if (p.after) {
    whereParts.push(
      or(
        gt(bookings.createdAt, new Date(p.after.createdAt)),
        and(eq(bookings.createdAt, new Date(p.after.createdAt)), gt(bookings.id, p.after.id)),
      ),
    );
  }

  const rows = await db
    .select({
      id: bookings.id,
      senderId: bookings.senderId,
      companyId: bookings.companyId,
      sourceId: bookings.sourceId,
      statusId: bookings.statusId,
      createdBy: bookings.createdBy,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      cashierSessionId: bookings.cashierSessionId,
    })
    .from(bookings)
    .where(whereParts.length ? and(...whereParts) : undefined)
    .orderBy(asc(bookings.createdAt), asc(bookings.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function getBookingRepo(id: string): Promise<BookingRow | null> {
  const [row] = await db
    .select({
      id: bookings.id,
      senderId: bookings.senderId,
      companyId: bookings.companyId,
      sourceId: bookings.sourceId,
      statusId: bookings.statusId,
      createdBy: bookings.createdBy,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      cashierSessionId: bookings.cashierSessionId,
    })
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  return row ?? null;
}

export async function countParcelsForBookingRepo(bookingId: string): Promise<number> {
  const [r] = await db.select({ c: count() }).from(parcels).where(eq(parcels.bookingId, bookingId));
  return Number((r?.c as unknown as bigint) ?? 0n);
}

export async function createBookingRepo(
  values: typeof bookings.$inferInsert,
): Promise<{ id: string }> {
  const [row] = await db.insert(bookings).values(values).returning({ id: bookings.id });
  return row;
}
