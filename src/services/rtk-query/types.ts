import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';

export const LIST_TAG_ID = 'LIST' as const;

export type ResourceTag =
  | 'Auth'
  | 'Bookings'
  | 'Cards'
  | 'CompanyModules'
  | 'Customers'
  | 'Inventory'
  | 'Branches'
  | 'HR'
  | 'Locations'
  | 'Payroll'
  | 'Statuses'
  | 'Users'
  | 'Cashiers'
  | 'RBAC';

export type ServerListQuery<TFilters = Record<string, unknown>> = PaginationRequestDto<TFilters>;
export type ServerListResponse<TItem> = PaginatedResponseDto<TItem>;
