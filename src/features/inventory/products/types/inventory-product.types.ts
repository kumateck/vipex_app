import type { ServerListQuery } from '@/services/rtk-query';

export interface InventoryProduct {
  id: string;
  companyId: string;
  categoryId: string | null;
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: number;
  minStockLevel: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryProductCategoryOption {
  id: string;
  name: string;
}

export type InventoryProductFilters = {
  companyId?: string | null;
  categoryId?: string | null;
};

export type InventoryProductListQuery = ServerListQuery<InventoryProductFilters>;

export interface InventoryProductMutationInput {
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string | null;
  unitOfMeasure: number;
  minStockLevel?: string | null;
}

export interface InventoryProductCreatePayload {
  companyId: string;
  categoryId?: string;
  sku: string;
  name: string;
  description?: string;
  unitOfMeasure: number;
  minStockLevel?: string;
  createdBy: string;
}

export interface InventoryProductUpdatePayload {
  categoryId?: string | null;
  name: string;
  description: string | null;
  unitOfMeasure: number;
  minStockLevel?: string;
}
