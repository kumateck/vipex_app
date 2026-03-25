import type {
  BranchCreatePayload,
  BranchMutationInput,
  BranchUpdatePayload,
} from '../types/branch.types';
import { normalizeOptionalFields, toOptionalString } from '@/lib/optional-fields';

const toNullable = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

export function sanitizeBranchMutationInput(input: BranchMutationInput): BranchMutationInput {
  return {
    name: input.name.trim(),
    type: input.type,
    telephone: toNullable(input.telephone),
    address: toNullable(input.address),
    email: toNullable(input.email),
    usePickupQueue: Boolean(input.usePickupQueue),
  };
}

export function toCreateBranchPayload(
  input: BranchMutationInput,
  context: { companyId: string; createdBy: string },
): BranchCreatePayload {
  const normalized = normalizeOptionalFields(
    {
      telephone: input.telephone,
      address: input.address,
      email: input.email,
    },
    ['telephone', 'address', 'email'] as const,
  );
  const telephone = toOptionalString(normalized.telephone);
  const address = toOptionalString(normalized.address);
  const email = toOptionalString(normalized.email);

  return {
    name: input.name.trim(),
    type: input.type,
    ...(telephone ? { telephone } : {}),
    ...(address ? { address } : {}),
    ...(email ? { email } : {}),
    usePickupQueue: Boolean(input.usePickupQueue),
    companyId: context.companyId,
    createdBy: context.createdBy,
  };
}

export function toUpdateBranchPayload(input: BranchMutationInput): BranchUpdatePayload {
  return sanitizeBranchMutationInput(input);
}
