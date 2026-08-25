import type { ParcelSearchRow } from '@mobile/types/parcels';

export type ParcelSearchState = {
  query: string;
  rows: ParcelSearchRow[];
  searched: boolean;
  searchBusy: boolean;
  setQuery: (value: string) => void;
  clearSearch: () => void;
  runSearch: () => Promise<void>;
  openParcel: (parcel: ParcelSearchRow) => void;
};
