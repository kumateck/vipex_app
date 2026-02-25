import type {
  BranchCreatePayload,
  BranchMutationInput,
  BranchUpdatePayload,
} from '../types/branch.types';

const toNullable = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

export function sanitizeBranchMutationInput(input: BranchMutationInput): BranchMutationInput {
  return {
    name: input.name.trim(),
    type: input.type.trim(),
    telephone: toNullable(input.telephone),
    address: toNullable(input.address),
    email: toNullable(input.email),
  };
}

export function toCreateBranchPayload(
  input: BranchMutationInput,
  context: { companyId: string; createdBy: string },
): BranchCreatePayload {
  return {
    ...sanitizeBranchMutationInput(input),
    companyId: context.companyId,
    createdBy: context.createdBy,
  };
}

export function toUpdateBranchPayload(input: BranchMutationInput): BranchUpdatePayload {
  return sanitizeBranchMutationInput(input);
}
