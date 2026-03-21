import type {
  LocationCreatePayload,
  LocationMutationInput,
  LocationUpdatePayload,
} from '../types/location.types';
import { toOptionalString } from '@/lib/optional-fields';

export function toCreateLocationPayload(
  input: LocationMutationInput,
  context: { companyId: string; createdBy: string },
): LocationCreatePayload {
  const branchId = toOptionalString(input.branchId);
  if (!branchId) {
    throw new Error('Branch is required to create a location');
  }

  return {
    name: input.name.trim(),
    branchId,
    companyId: context.companyId,
    createdBy: context.createdBy,
  };
}

export function toUpdateLocationPayload(input: LocationMutationInput): LocationUpdatePayload {
  return {
    name: input.name.trim(),
  };
}
