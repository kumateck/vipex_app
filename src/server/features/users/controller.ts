import { encodeCursor } from '../../utils/cursor';
import type { ListUsersParams } from './repository';
import { createUserSvc, getUserByIdSvc, listUsersSvc } from './service';

function toUserDto(u: {
  id: string;
  fullname: string;
  email: string;
  telephone: string;
  userStatus: string;
  companyId: string;
  branchId: string;
  createdAt: Date | null;
}) {
  return {
    id: u.id,
    fullname: u.fullname,
    email: u.email,
    telephone: u.telephone,
    status: u.userStatus,
    companyId: u.companyId,
    branchId: u.branchId,
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
  };
}

export async function listUsersCtrl(params: ListUsersParams) {
  const { data, nextCursor } = await listUsersSvc(params);
  return {
    data: data.map(toUserDto),
    nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
  };
}

export async function getUserByIdCtrl(id: string) {
  const u = await getUserByIdSvc(id);
  return toUserDto(u);
}

export async function createUserCtrl(input: {
  fullname: string;
  email: string;
  telephone: string;
  password: string;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
}) {
  return createUserSvc(input);
}
