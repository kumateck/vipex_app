import { mobileApiGet } from '@mobile/lib/api';
import type { ParcelSearchRow } from '@mobile/types/parcels';

export function findParcels(token: string, input: { companyId: string; query: string }) {
  return mobileApiGet<{
    data: ParcelSearchRow[];
    meta?: { totalRecords?: number; totalPages?: number };
  }>({
    path: '/shipments/parcels',
    token,
    query: {
      search: input.query,
      companyId: input.companyId,
      includeDeleted: true,
      undeliveredFirst: true,
      page: 1,
      pageSize: 20,
    },
  });
}
