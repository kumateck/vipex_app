import { decodeCursor, encodeCursor, type CursorKey } from '@/server/utils/cursor';
import {
  createParcelSvc,
  getParcelSvc,
  listParcelsSvc,
  markParcelReceivedSvc,
  setPlannedToBePaidSvc,
  updateParcelSvc,
} from './parcels.service';

export async function listParcelsCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  statusId?: string | null;
  search?: string | null;
  received?: boolean | null;
  includeDeleted?: boolean | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<CursorKey>(q.after || null);
  const { data, nextCursor } = await listParcelsSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    sourceId: q.sourceId ?? null,
    destinationId: q.destinationId ?? null,
    statusId: q.statusId ?? null,
    search: q.search ?? null,
    received: q.received ?? null,
    includeDeleted: q.includeDeleted ?? null,
  });
  return {
    data: data.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      receivedAt: p.receivedAt ? p.receivedAt.toISOString() : null,
      confirmedAt: p.confirmedAt ? p.confirmedAt.toISOString() : null,
      bookingCreatedAt: p.bookingCreatedAt ? p.bookingCreatedAt.toISOString() : null,
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export const getParcelByIdCtrl = getParcelSvc;
export const createParcelCtrl = createParcelSvc;
export const updateParcelCtrl = updateParcelSvc;
export const markParcelReceivedCtrl = markParcelReceivedSvc;
export const setPlannedToBePaidCtrl = setPlannedToBePaidSvc;
