import type { ServerListQuery } from '@/services/rtk-query';

export interface InventoryCategory {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type InventoryCategoryFilters = {
  companyId?: string | null;
};

export type InventoryCategoryListQuery = ServerListQuery<InventoryCategoryFilters>;

export interface InventoryCategoryMutationInput {
  name: string;
  description?: string | null;
}

export interface InventoryCategoryCreatePayload {
  companyId: string;
  createdBy: string;
  name: string;
  description?: string;
}

export interface InventoryCategoryUpdatePayload {
  name: string;
  description: string | null;
}
