import { decodeCursor, encodeCursor } from '@/server/utils/cursor';

import {
  createStatusSvc,
  deleteStatusSvc,
  getStatusSvc,
  listStatusesSvc,
  updateStatusSvc,
} from './service';

// Normalize DB row to API DTO
function toStatusDto(s: {
  id: string;
  companyId: string;
  name: string;
  color: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}) {
  return {
    id: s.id,
    companyId: s.companyId,
    name: s.name,
    color: s.color,
    isDeleted: !!s.isDeleted,
    createdBy: s.createdBy,
    createdAt:
      s.createdAt && typeof s.createdAt !== 'string'
        ? s.createdAt.toISOString()
        : (s.createdAt ?? null),
    updatedAt:
      s.updatedAt && typeof s.updatedAt !== 'string'
        ? s.updatedAt.toISOString()
        : (s.updatedAt ?? null),
  };
}

export async function listStatusesCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  includeDeleted?: boolean | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listStatusesSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    includeDeleted: q.includeDeleted ?? null,
  });

  return {
    data: data.map(toStatusDto),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getStatusByIdCtrl(id: string) {
  const s = await getStatusSvc(id);
  return toStatusDto(s);
}

export async function createStatusCtrl(input: {
  companyId: string;
  name: string;
  color: string;
  createdBy: string;
}) {
  return createStatusSvc(input);
}

export async function updateStatusCtrl(id: string, patch: { name?: string; color?: string }) {
  return updateStatusSvc(id, patch);
}

export async function deleteStatusCtrl(id: string) {
  return deleteStatusSvc(id);
}
