import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import {
  createLocationSvc,
  deleteLocationSvc,
  getLocationSvc,
  listLocationsSvc,
  updateLocationSvc,
} from './service';

// Normalize DB row to API DTO
function toLocationDto(l: {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}) {
  return {
    id: l.id,
    companyId: l.companyId,
    branchId: l.branchId,
    name: l.name,
    isDeleted: !!l.isDeleted,
    createdBy: l.createdBy,
    createdAt:
      l.createdAt && typeof l.createdAt !== 'string'
        ? l.createdAt.toISOString()
        : (l.createdAt ?? null),
    updatedAt:
      l.updatedAt && typeof l.updatedAt !== 'string'
        ? l.updatedAt.toISOString()
        : (l.updatedAt ?? null),
  };
}

export async function listLocationsCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  includeDeleted?: boolean | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listLocationsSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    branchId: q.branchId ?? null,
    includeDeleted: q.includeDeleted ?? null,
  });

  return {
    data: data.map(toLocationDto),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getLocationByIdCtrl(id: string) {
  const l = await getLocationSvc(id);
  return toLocationDto(l);
}

export async function createLocationCtrl(input: {
  companyId: string;
  branchId: string;
  name: string;
  createdBy: string;
}) {
  return createLocationSvc(input);
}

export async function updateLocationCtrl(id: string, patch: { name?: string }) {
  return updateLocationSvc(id, patch);
}

export async function deleteLocationCtrl(id: string) {
  return deleteLocationSvc(id);
}
