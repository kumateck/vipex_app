import type {
  InventoryCategoryCreatePayload,
  InventoryCategoryMutationInput,
  InventoryCategoryUpdatePayload,
} from '../types/inventory-category.types';

const toNullable = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

export function sanitizeInventoryCategoryMutationInput(
  input: InventoryCategoryMutationInput,
): InventoryCategoryUpdatePayload {
  return {
    name: input.name.trim(),
    description: toNullable(input.description),
  };
}

export function toCreateInventoryCategoryPayload(
  input: InventoryCategoryMutationInput,
  context: { companyId: string; createdBy: string },
): InventoryCategoryCreatePayload {
  const sanitized = sanitizeInventoryCategoryMutationInput(input);

  return {
    companyId: context.companyId,
    createdBy: context.createdBy,
    name: sanitized.name,
    ...(sanitized.description ? { description: sanitized.description } : {}),
  };
}

export function toUpdateInventoryCategoryPayload(
  input: InventoryCategoryMutationInput,
): InventoryCategoryUpdatePayload {
  return sanitizeInventoryCategoryMutationInput(input);
}
