export type SortDirection = "asc" | "desc";

export interface SortField {
  field: string;
  direction: SortDirection;
}

export interface PaginationRequestDto<TFilters = Record<string, any>> {
  page?: number; // default: 1
  pageSize?: number; // default: 10 or 20
  search?: string; // global search

  sort?: SortField[]; // multiple sort fields

  filters?: TFilters; // strongly typed per endpoint

  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
}

export interface PaginationMeta {
  totalRecords: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;
}

export type NormalizedPagination<TFilters = Record<string, any>> = Required<
  Pick<PaginationRequestDto<TFilters>, 'page' | 'pageSize'>
> &
  Omit<PaginationRequestDto<TFilters>, 'page' | 'pageSize'> & {
    offset: number;
  };
