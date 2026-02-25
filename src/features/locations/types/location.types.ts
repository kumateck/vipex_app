import type { ServerListQuery } from '@/services/rtk-query';

export interface Location {
  id: string;
  name: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
  } | null;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type LocationFilters = {
  companyId?: string | null;
  branchId?: string | null;
  includeDeleted?: boolean | null;
};

export type LocationListQuery = ServerListQuery<LocationFilters>;

export interface LocationMutationInput {
  name: string;
  branchId?: string;
}

export interface LocationCreatePayload extends LocationMutationInput {
  companyId: string;
  createdBy: string;
}

export interface LocationUpdatePayload {
  name: string;
}
