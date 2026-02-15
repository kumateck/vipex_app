import { encodeCursor } from '@/server/utils/cursor';
import {
  createSessionTypeSvc,
  getSessionSvc,
  listSessionTypesSvc,
  listSessionsSvc,
  openSessionSvc,
  closeSessionSvc,
} from './service';

export async function listSessionTypesCtrl() {
  const rows = await listSessionTypesSvc();
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export const createSessionTypeCtrl = createSessionTypeSvc;

export async function listSessionsCtrl(q: {
  limit?: number;
  after?: string | null;
  cashierId?: string | null;
  branchId?: string | null;
  activeOnly?: boolean | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = q.after
    ? (JSON.parse(Buffer.from(q.after, 'base64url').toString('utf8')) as {
        scheduledStartTime: string;
        id: string;
      })
    : null;
  const { data, nextCursor } = await listSessionsSvc({
    limit,
    after,
    cashierId: q.cashierId ?? null,
    branchId: q.branchId ?? null,
    activeOnly: q.activeOnly ?? null,
  });
  return {
    data: data.map((s) => ({
      ...s,
      scheduledStartTime: s.scheduledStartTime.toISOString(),
      actualEndTime: s.actualEndTime ? s.actualEndTime.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export const getSessionByIdCtrl = getSessionSvc;
export const openSessionCtrl = openSessionSvc;
export const closeSessionCtrl = closeSessionSvc;
