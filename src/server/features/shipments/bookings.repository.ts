import { and, asc, count, desc, eq, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { bookings, parcels } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type BookingRow = {
  id: string;
  companyId: string;
  sourceId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cashierSessionId: string | null;
};

export type ListBookingsParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  sourceId?: string | null;
  sort?: SortField[] | null;
};

export async function listBookingsRepo(
  p: ListBookingsParams,
): Promise<{ data: BookingRow[]; totalRecords: number }> {
  const whereParts: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [];
  if (p.companyId) whereParts.push(eq(bookings.companyId, p.companyId));
  if (p.sourceId) whereParts.push(eq(bookings.sourceId, p.sourceId));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(bookings.createdAt) : asc(bookings.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(bookings.id) : asc(bookings.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(bookings.createdAt), asc(bookings.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(bookings)
    .where(whereParts.length ? and(...whereParts) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select({
      id: bookings.id,
      companyId: bookings.companyId,
      sourceId: bookings.sourceId,
      createdBy: bookings.createdBy,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      cashierSessionId: bookings.cashierSessionId,
    })
    .from(bookings)
    .where(whereParts.length ? and(...whereParts) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getBookingRepo(id: string): Promise<BookingRow | null> {
  const [row] = await db
    .select({
      id: bookings.id,
      companyId: bookings.companyId,
      sourceId: bookings.sourceId,
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
  if (!row) throw new Error('Failed to create booking');
  return row;
}
