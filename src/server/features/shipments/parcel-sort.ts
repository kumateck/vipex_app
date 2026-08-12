import type { SortDirection, SortField } from '@/server/types/pagination.types';

export function resolveParcelSort(
  sort: SortField[] | null | undefined,
  createdAtOrder: SortDirection | null | undefined,
): SortField[] | undefined {
  if (!createdAtOrder) return sort ?? undefined;

  return [
    { field: 'createdAt', direction: createdAtOrder },
    { field: 'id', direction: createdAtOrder },
  ];
}
