import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import {
  createBranchSvc,
  deleteBranchSvc,
  getBranchSvc,
  listBranchesSvc,
  updateBranchSvc,
} from './service';

// Shape returned to clients
function toBranchDto(b: {
  id: string;
  companyId: string;
  name: string;
  type: string;
  telephone: string | null;
  address: string | null;
  email: string | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}) {
  return {
    id: b.id,
    companyId: b.companyId,
    name: b.name,
    type: b.type,
    telephone: b.telephone ?? null,
    address: b.address ?? null,
    email: b.email ?? null,
    isDeleted: !!b.isDeleted,
    createdBy: b.createdBy,
    createdAt:
      b.createdAt && typeof b.createdAt !== 'string'
        ? b.createdAt.toISOString()
        : (b.createdAt ?? null),
    updatedAt:
      b.updatedAt && typeof b.updatedAt !== 'string'
        ? b.updatedAt.toISOString()
        : (b.updatedAt ?? null),
  };
}

export async function listBranchesCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listBranchesSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
  });

  return {
    data: data.map(toBranchDto),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getBranchByIdCtrl(id: string) {
  const b = await getBranchSvc(id);
  return toBranchDto(b);
}

export async function createBranchCtrl(input: {
  companyId: string;
  name: string;
  type: string;
  telephone?: string | null;
  address?: string | null;
  email?: string | null;
  createdBy: string;
}) {
  return createBranchSvc(input);
}

export async function updateBranchCtrl(
  id: string,
  patch: {
    name?: string;
    type?: string;
    telephone?: string | null;
    address?: string | null;
    email?: string | null;
  },
) {
  return updateBranchSvc(id, patch);
}

export async function deleteBranchCtrl(id: string) {
  return deleteBranchSvc(id);
}
