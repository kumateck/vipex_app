import { decodeCursor, encodeCursor, type CursorKey } from '@/server/utils/cursor';
import {
  createCustomerSvc,
  deleteCustomerSvc,
  getCustomerSvc,
  listCustomersSvc,
  updateCustomerSvc,
} from './service';

export type ListCustomersQuery = {
  limit?: number;
  after?: string | null;
  companyId: string;
  search?: string | null;
  includeDeleted?: boolean | null;
};

export async function listCustomersCtrl(q: ListCustomersQuery) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<CursorKey>(q.after || null);
  const { data, nextCursor } = await listCustomersSvc({
    limit,
    after,
    companyId: q.companyId,
    search: q.search ?? null,
    includeDeleted: q.includeDeleted ?? null,
  });
  return {
    data: data.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export const getCustomerByIdCtrl = getCustomerSvc;
export const createCustomerCtrl = createCustomerSvc;
export const updateCustomerCtrl = updateCustomerSvc;
export const deleteCustomerCtrl = deleteCustomerSvc;
