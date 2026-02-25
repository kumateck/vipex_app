import type { PaginationState, SortingState } from '@tanstack/react-table';
import type {
  PaginationMeta,
  PaginationRequestDto,
  SortField,
} from '@/server/types/pagination.types';

export function tableSortingToSortFields(sorting: SortingState): SortField[] {
  return sorting.map((item) => ({
    field: item.id,
    direction: item.desc ? 'desc' : 'asc',
  }));
}

export function buildServerPaginationRequest<TFilters = Record<string, unknown>>(args: {
  pagination: PaginationState;
  sorting: SortingState;
  search?: string;
  filters?: TFilters;
  dateFrom?: string;
  dateTo?: string;
}): PaginationRequestDto<TFilters> {
  return {
    page: args.pagination.pageIndex + 1,
    pageSize: args.pagination.pageSize,
    search: args.search || undefined,
    sort: tableSortingToSortFields(args.sorting),
    filters: args.filters,
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
  };
}

export function paginationMetaToState(meta: PaginationMeta): PaginationState {
  return {
    pageIndex: Math.max(meta.page - 1, 0),
    pageSize: meta.pageSize,
  };
}
