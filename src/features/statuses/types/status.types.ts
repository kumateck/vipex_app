import type { ServerListQuery } from '@/services/rtk-query';

export interface Status {
  id: string;
  companyId: string;
  name: string;
  color: string;
  isDeleted?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StatusFilters = {
  companyId?: string | null;
  includeDeleted?: boolean | null;
};

export type StatusListQuery = ServerListQuery<StatusFilters>;

export interface StatusMutationInput {
  name: string;
  color: string;
}

export interface StatusCreatePayload extends StatusMutationInput {
  companyId: string;
  createdBy: string;
}

export type StatusUpdatePayload = StatusMutationInput;
