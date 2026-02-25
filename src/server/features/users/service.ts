import { BadRequest, NotFound } from '../../utils/http-error';
import {
  createUserRepo,
  getUserRepo,
  listUserOptionsRepo,
  listUsersRepo,
  updateUserRepo,
  type ListUserParams,
} from './repository';

export async function listUsersSvc(p: ListUserParams) {
  return listUsersRepo(p);
}
export async function listUserOptionsSvc(p: {
  companyId?: string | null;
  branchId?: string | null;
  roleId?: string | null;
  status?: number | null;
  search?: string | null;
}) {
  return listUserOptionsRepo(p);
}
export async function getUserSvc(id: string) {
  const u = await getUserRepo(id);
  if (!u) throw NotFound('User not found');
  return u;
}
export async function createUserSvc(input: {
  fullname: string;
  telephone: string;
  email: string;
  status?: number;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
}) {
  if (!input.fullname || !input.email || !input.telephone)
    throw BadRequest('Missing required fields');
  const created = await createUserRepo({
    ...input,
  });
  return { id: created?.id };
}
export async function updateUserSvc(
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
  const cur = await getUserRepo(id);
  if (!cur) throw NotFound('User not found');
  const updated = await updateUserRepo(id, patch);
  if (!updated) throw NotFound('User not found');
  return { id: updated.id };
}
