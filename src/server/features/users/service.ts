import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../utils/password';
import { Conflict, NotFound } from '../../utils/http-error';
import {
  createUserRepo,
  getUserByEmailRepo,
  getUserByIdRepo,
  listUsersRepo,
  type ListUsersParams,
} from './repository';

export async function listUsersSvc(params: ListUsersParams) {
  return listUsersRepo(params);
}

export async function getUserByIdSvc(id: string) {
  const user = await getUserByIdRepo(id);
  if (!user) throw NotFound('User not found');
  return user;
}

export async function createUserSvc(input: {
  fullname: string;
  email: string;
  telephone: string;
  password: string;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
}) {
  const existing = await getUserByEmailRepo(input.email);
  if (existing) throw Conflict('Email already registered');

  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);

  await createUserRepo({
    id,
    fullname: input.fullname,
    email: input.email,
    telephone: input.telephone,
    passwordHash,
    roleId: input.roleId,
    companyId: input.companyId,
    branchId: input.branchId,
    createdBy: input.createdBy,
  });

  return { id };
}
