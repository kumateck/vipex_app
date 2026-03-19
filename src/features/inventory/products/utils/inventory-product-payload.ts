import type {
  InventoryProductCreatePayload,
  InventoryProductMutationInput,
  InventoryProductUpdatePayload,
} from '../types/inventory-product.types';

const toNullable = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);
const toOptional = (value: string | null | undefined) => (value?.trim() ? value.trim() : undefined);

export function toCreateInventoryProductPayload(
  input: InventoryProductMutationInput,
  context: { companyId: string; createdBy: string },
): InventoryProductCreatePayload {
  return {
    companyId: context.companyId,
    createdBy: context.createdBy,
    sku: (input.sku ?? '').trim(),
    name: input.name.trim(),
    unitOfMeasure: input.unitOfMeasure,
    ...(toOptional(input.categoryId) ? { categoryId: toOptional(input.categoryId) } : {}),
    ...(toOptional(input.description) ? { description: toOptional(input.description) } : {}),
    ...(toOptional(input.minStockLevel) ? { minStockLevel: toOptional(input.minStockLevel) } : {}),
  };
}

export function toUpdateInventoryProductPayload(
  input: InventoryProductMutationInput,
): InventoryProductUpdatePayload {
  return {
    name: input.name.trim(),
    description: toNullable(input.description),
    unitOfMeasure: input.unitOfMeasure,
    categoryId: toNullable(input.categoryId),
    ...(toOptional(input.minStockLevel) ? { minStockLevel: toOptional(input.minStockLevel) } : {}),
  };
}
