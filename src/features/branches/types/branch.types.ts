import type { ServerListQuery } from '@/services/rtk-query';

export interface Branch {
  id: string;
  name: string;
  type: string;
  telephone: string | null;
  address: string | null;
  email: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type BranchFilters = {
  companyId?: string | null;
};

export type BranchListQuery = ServerListQuery<BranchFilters>;

export interface BranchMutationInput {
  name: string;
  type: string;
  telephone?: string | null;
  address?: string | null;
  email?: string | null;
}

export interface BranchCreatePayload extends BranchMutationInput {
  companyId: string;
  createdBy: string;
}

export interface BranchUpdatePayload extends BranchMutationInput {}
