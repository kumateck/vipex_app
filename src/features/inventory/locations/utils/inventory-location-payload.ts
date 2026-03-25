import type {
  InventoryLocationCreatePayload,
  InventoryLocationMutationInput,
  InventoryLocationUpdatePayload,
} from '../types/inventory-location.types';
import { toOptionalString } from '@/lib/optional-fields';

const toNullable = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

export function sanitizeInventoryLocationMutationInput(
  input: InventoryLocationMutationInput,
): InventoryLocationUpdatePayload {
  return {
    name: input.name.trim(),
    description: toNullable(input.description),
  };
}

export function toCreateInventoryLocationPayload(
  input: InventoryLocationMutationInput,
  context: { companyId: string; createdBy: string },
): InventoryLocationCreatePayload {
  const sanitized = sanitizeInventoryLocationMutationInput(input);
  const branchId = toOptionalString(input.branchId);
  if (!branchId) {
    throw new Error('Branch is required to create an inventory location');
  }

  return {
    name: sanitized.name,
    branchId,
    ...(sanitized.description ? { description: sanitized.description } : {}),
    companyId: context.companyId,
    createdBy: context.createdBy,
  };
}

export function toUpdateInventoryLocationPayload(
  input: InventoryLocationMutationInput,
): InventoryLocationUpdatePayload {
  return sanitizeInventoryLocationMutationInput(input);
}
