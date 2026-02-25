import type {
  NormalizedPagination,
  PaginationMeta,
  PaginationRequestDto,
} from '@/server/types/pagination.types';

export type PaginationDefaults = {
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
};

export function normalizePagination<TFilters = Record<string, any>>(
  input: PaginationRequestDto<TFilters> | undefined,
  defaults: PaginationDefaults = {},
): NormalizedPagination<TFilters> {
  const pageDefault = defaults.page ?? 1;
  const pageSizeDefault = defaults.pageSize ?? 20;
  const maxPageSize = defaults.maxPageSize ?? 100;

  const pageRaw = input?.page ?? pageDefault;
  const pageSizeRaw = input?.pageSize ?? pageSizeDefault;

  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : pageDefault;
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(1, Math.floor(pageSizeRaw)), maxPageSize)
    : pageSizeDefault;

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    search: input?.search,
    sort: input?.sort,
    filters: input?.filters,
    dateFrom: input?.dateFrom,
    dateTo: input?.dateTo,
  } as NormalizedPagination<TFilters>;
}

export function buildPaginationMeta(args: {
  totalRecords: number;
  page: number;
  pageSize: number;
}): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(args.totalRecords / args.pageSize));
  const safePage = Math.min(Math.max(1, args.page), totalPages);

  return {
    totalRecords: args.totalRecords,
    totalPages,
    page: safePage,
    pageSize: args.pageSize,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}
