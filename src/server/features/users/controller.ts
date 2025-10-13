import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import { createUserSvc, getUserSvc, listUsersSvc, updateUserSvc } from './service';

// Normalize DB row to API DTO
function toUserDto(u: {
  id: string;
  fullname: string;
  telephone: string;
  email: string;
  status: number;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  roleName?: string | null;
  branchName?: string | null;
  companyName?: string | null;
}) {
  return {
    id: u.id,
    fullname: u.fullname,
    telephone: u.telephone,
    email: u.email,
    status: u.status,
    roleId: u.roleId,
    companyId: u.companyId,
    branchId: u.branchId,
    createdBy: u.createdBy,
    createdAt:
      u.createdAt && typeof u.createdAt !== 'string'
        ? u.createdAt.toISOString()
        : (u.createdAt ?? null),
    updatedAt:
      u.updatedAt && typeof u.updatedAt !== 'string'
        ? u.updatedAt.toISOString()
        : (u.updatedAt ?? null),
    roleName: u.roleName ?? null,
    branchName: u.branchName ?? null,
    companyName: u.companyName ?? null,
  };
}

export async function listUsersCtrl(q: {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  roleId?: string | null;
  status?: number | null;
  search?: string | null;
}) {
  const limit = q.limit ? Math.min(Math.max(q.limit, 1), 100) : 25;
  const after = decodeCursor<{ createdAt: string; id: string }>(q.after || null);

  const { data, nextCursor } = await listUsersSvc({
    limit,
    after,
    companyId: q.companyId ?? null,
    branchId: q.branchId ?? null,
    roleId: q.roleId ?? null,
    status: q.status ?? null,
    search: q.search ?? null,
  });

  return {
    data: data.map(toUserDto),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getUserByIdCtrl(id: string) {
  const u = await getUserSvc(id);
  return toUserDto(u);
}

export async function createUserCtrl(input: {
  fullname: string;
  telephone: string;
  email: string;
  status?: number;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
}) {
  return createUserSvc(input);
}

export async function updateUserCtrl(
  id: string,
  patch: {
    fullname?: string;
    telephone?: string;
    email?: string;
    status?: number;
    roleId?: string;
    branchId?: string;
  },
) {
  return updateUserSvc(id, patch);
}
