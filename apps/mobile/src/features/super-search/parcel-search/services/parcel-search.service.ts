import { searchParcels } from '@mobile/lib/api';

export function findParcels(token: string, input: { companyId: string; query: string }) {
  return searchParcels(token, {
    search: input.query,
    companyId: input.companyId,
    includeDeleted: true,
    page: 1,
    pageSize: 20,
  });
}
