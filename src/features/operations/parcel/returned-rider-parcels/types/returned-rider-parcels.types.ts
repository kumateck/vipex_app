import type { ParcelSearchRow } from '../../api/parcel.api';

export type ReturnedRiderParcelsTableProps = {
  rows: ParcelSearchRow[];
  isFetching: boolean;
  hasError: boolean;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  riders: Array<{ id: string; fullname: string }>;
  riderUserId: string;
  onRiderChange: (id: string) => void;
  busyParcelId: string | null;
  onReprocess: (row: ParcelSearchRow, action: 'pickup' | 'redispatch') => void;
  page: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
};
