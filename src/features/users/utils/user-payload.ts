import type { UserCreatePayload, UserMutationInput } from '../types/user.types';
import { UserType } from '@/db/schemas/enums';

function toOptionalString(value?: string | null) {
  const trimmed = String(value ?? '').trim();
  return trimmed ? trimmed : null;
}

export function toCreateUserPayload(input: UserMutationInput): UserCreatePayload {
  const cashierType = input.userType === UserType.CASHIER ? (input.cashierType ?? null) : null;

  return {
    fullname: input.fullname.trim(),
    telephone: input.telephone.trim(),
    email: input.email.trim(),
    status: input.status,
    roleId: input.roleId.trim(),
    branchId: input.branchId.trim(),
    locationId: toOptionalString(input.locationId),
    userType: input.userType,
    cashierType,
    sendInvite: input.sendInvite ?? true,
  };
}

export function toUpdateUserPayload(input: UserMutationInput): UserMutationInput {
  const cashierType = input.userType === UserType.CASHIER ? (input.cashierType ?? null) : null;

  return {
    fullname: input.fullname.trim(),
    telephone: input.telephone.trim(),
    email: input.email.trim(),
    status: input.status,
    roleId: input.roleId.trim(),
    branchId: input.branchId.trim(),
    locationId: toOptionalString(input.locationId),
    userType: input.userType,
    cashierType,
  };
}
