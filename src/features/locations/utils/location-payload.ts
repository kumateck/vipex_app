import type {
  LocationCreatePayload,
  LocationMutationInput,
  LocationUpdatePayload,
} from '../types/location.types';

export function toCreateLocationPayload(
  input: LocationMutationInput,
  context: { companyId: string; createdBy: string },
): LocationCreatePayload {
  return {
    name: input.name.trim(),
    branchId: (input.branchId ?? '').trim(),
    companyId: context.companyId,
    createdBy: context.createdBy,
  };
}

export function toUpdateLocationPayload(input: LocationMutationInput): LocationUpdatePayload {
  return {
    name: input.name.trim(),
  };
}
