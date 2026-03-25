import type { ServerListQuery } from '@/services/rtk-query';

export interface Card {
  id: string;
  name: string;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CardFilters = {
  companyId?: string | null;
  includeDeleted?: boolean | null;
};

export type CardListQuery = ServerListQuery<CardFilters>;

export interface CardMutationInput {
  name: string;
}

export interface CardCreatePayload extends CardMutationInput {
  companyId: string;
  createdBy: string;
}

export interface CardUpdatePayload {
  name: string;
}
