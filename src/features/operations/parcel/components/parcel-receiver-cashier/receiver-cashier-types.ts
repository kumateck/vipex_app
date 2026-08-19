import type { PaginationMeta } from '@/server/types/pagination.types';

export type CardMode = 'none' | 'existing' | 'new';
export type HandoverTarget = 'main' | 'second';

export type CustomerCardRecord = {
  id: string;
  cardId: string;
  cardNumber: string;
  cardName: string;
};

export type PaymentMethodOption = {
  value: number;
  label: string;
};

export type PaymentTypeLegendItem = {
  label: string;
  dotClassName: string;
};

export const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};
