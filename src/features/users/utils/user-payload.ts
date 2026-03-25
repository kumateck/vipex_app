import type { UserCreatePayload, UserMutationInput } from '../types/user.types';

function toOptionalString(value?: string | null) {
  const trimmed = String(value ?? '').trim();
  return trimmed ? trimmed : null;
}

export function toCreateUserPayload(input: UserMutationInput): UserCreatePayload {
  return {
    fullname: input.fullname.trim(),
    telephone: input.telephone.trim(),
    email: input.email.trim(),
    status: input.status,
    roleId: input.roleId.trim(),
    branchId: input.branchId.trim(),
    locationId: toOptionalString(input.locationId),
    userType: input.userType,
    sendInvite: input.sendInvite ?? true,
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
    locationId: toOptionalString(input.locationId),
    userType: input.userType,
  };
}
