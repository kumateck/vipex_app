import type { ServerListQuery } from '@/services/rtk-query';

export type ParcelSuperSearchFilters = {
  companyId?: string | null;
  includeDeleted?: boolean | null;
};

export type ParcelSuperSearchQuery = ServerListQuery<ParcelSuperSearchFilters>;
