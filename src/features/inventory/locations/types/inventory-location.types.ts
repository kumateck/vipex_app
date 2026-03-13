import type { ServerListQuery } from '@/services/rtk-query';

export interface InventoryLocation {
  id: string;
  name: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
  } | null;
  description: string | null;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type InventoryLocationFilters = {
  companyId?: string | null;
  branchId?: string | null;
  includeDeleted?: boolean | null;
};

export type InventoryLocationListQuery = ServerListQuery<InventoryLocationFilters>;

export interface InventoryLocationMutationInput {
  name: string;
  branchId?: string;
  description?: string | null;
}

export interface InventoryLocationCreatePayload {
  name: string;
  branchId: string;
  description?: string;
  companyId: string;
  createdBy: string;
}

export interface InventoryLocationUpdatePayload {
  name: string;
  description: string | null;
}
