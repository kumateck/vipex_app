import type { ServerListQuery } from '@/services/rtk-query';
import type { BranchType } from '@/shared/access/constants';

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  telephone: string | null;
  address: string | null;
  email: string | null;
  usePickupQueue: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BranchFilters = {
  companyId?: string | null;
};

export type BranchListQuery = ServerListQuery<BranchFilters>;

export interface BranchMutationInput {
  name: string;
  type: BranchType;
  telephone?: string | null;
  address?: string | null;
  email?: string | null;
  usePickupQueue?: boolean;
}

export interface BranchCreatePayload extends BranchMutationInput {
  companyId: string;
  createdBy: string;
}

export type BranchUpdatePayload = BranchMutationInput;
