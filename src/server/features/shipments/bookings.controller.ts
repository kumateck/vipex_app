import { decodeCursor, encodeCursor, type CursorKey } from '@/server/utils/cursor';
import { createBookingSvc, getBookingSvc, listBookingsSvc } from './bookings.service';

export async function listBookingsCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  senderId?: string | null;
  sourceId?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<CursorKey>(q.after || null);
  const { data, nextCursor } = await listBookingsSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    senderId: q.senderId ?? null,
    sourceId: q.sourceId ?? null,
  });
  return {
    data: data.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export const getBookingByIdCtrl = getBookingSvc;
export const createBookingCtrl = createBookingSvc;
