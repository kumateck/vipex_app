import type {
  InventoryLocationCreatePayload,
  InventoryLocationMutationInput,
  InventoryLocationUpdatePayload,
} from '../types/inventory-location.types';

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
  return {
    name: sanitized.name,
    branchId: (input.branchId ?? '').trim(),
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
