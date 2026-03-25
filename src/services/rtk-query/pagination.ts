import type { ServerListQuery } from './types';

export function buildServerPaginationParams<TFilters = Record<string, unknown>>(
  query?: ServerListQuery<TFilters> | void,
) {
  if (!query) return { page: 1, pageSize: 20 };

  const params: Record<string, unknown> = {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  };

  if (query.search) params.search = query.search;
  if (query.dateFrom) params.dateFrom = query.dateFrom;
  if (query.dateTo) params.dateTo = query.dateTo;

  if (query.filters && typeof query.filters === 'object') {
    for (const [key, value] of Object.entries(query.filters as Record<string, unknown>)) {
      if (value === null || value === undefined) continue;
      params[key] = value;
    }
  }

  return params;
}
