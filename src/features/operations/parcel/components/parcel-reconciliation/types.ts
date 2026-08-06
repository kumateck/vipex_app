import type { ServerListQuery } from '@/services/rtk-query';

export type ParcelReconciliationFilters = {
  companyId?: string | null;
  branchId?: string | null;
  statuses?: number[] | null;
};

export type ParcelReconciliationQuery = ServerListQuery<ParcelReconciliationFilters>;
