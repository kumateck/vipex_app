import type { UserCreatePayload, UserMutationInput } from '../types/user.types';

export function toCreateUserPayload(
  input: UserMutationInput,
  context: { companyId: string; createdBy: string },
): UserCreatePayload {
  return {
    fullname: input.fullname.trim(),
    telephone: input.telephone.trim(),
    email: input.email.trim(),
    status: input.status,
    roleId: input.roleId.trim(),
    branchId: input.branchId.trim(),
    companyId: context.companyId,
    createdBy: context.createdBy,
  };
}

export function toUpdateUserPayload(input: UserMutationInput): UserMutationInput {
  return {
    fullname: input.fullname.trim(),
    telephone: input.telephone.trim(),
    email: input.email.trim(),
    status: input.status,
    roleId: input.roleId.trim(),
    branchId: input.branchId.trim(),
  };
}
