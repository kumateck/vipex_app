import type {
  InventoryProductCreatePayload,
  InventoryProductUnitConversion,
  InventoryProductMutationInput,
  InventoryProductUpdatePayload,
} from '../types/inventory-product.types';

const toNullable = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);
const toOptional = (value: string | null | undefined) => (value?.trim() ? value.trim() : undefined);
const sanitizeUnitConversions = (
  values: InventoryProductUnitConversion[] | undefined,
): InventoryProductUnitConversion[] | undefined => {
  if (!values?.length) return undefined;
  return values
    .map((value) => ({
      unitOfMeasure: value.unitOfMeasure,
      factorToBase: value.factorToBase.trim(),
    }))
    .filter((value) => value.factorToBase.length > 0);
};

export function toCreateInventoryProductPayload(
  input: InventoryProductMutationInput,
  context: { companyId: string; createdBy: string },
): InventoryProductCreatePayload {
  const unitConversions = sanitizeUnitConversions(input.unitConversions);
  return {
    companyId: context.companyId,
    createdBy: context.createdBy,
    sku: (input.sku ?? '').trim(),
    name: input.name.trim(),
    unitOfMeasure: input.unitOfMeasure,
    isRecoverable: Boolean(input.isRecoverable),
    ...(unitConversions ? { unitConversions } : {}),
    ...(toOptional(input.categoryId) ? { categoryId: toOptional(input.categoryId) } : {}),
    ...(toOptional(input.description) ? { description: toOptional(input.description) } : {}),
    ...(toOptional(input.minStockLevel) ? { minStockLevel: toOptional(input.minStockLevel) } : {}),
  };
}

export function toUpdateInventoryProductPayload(
  input: InventoryProductMutationInput,
): InventoryProductUpdatePayload {
  const unitConversions = sanitizeUnitConversions(input.unitConversions);
  return {
    name: input.name.trim(),
    description: toNullable(input.description),
    unitOfMeasure: input.unitOfMeasure,
    isRecoverable: input.isRecoverable,
    ...(unitConversions ? { unitConversions } : {}),
    categoryId: toNullable(input.categoryId),
    ...(toOptional(input.minStockLevel) ? { minStockLevel: toOptional(input.minStockLevel) } : {}),
  };
}
