import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useGetStorageClearanceParcelAccrualQuery,
  useLazySearchStorageClearanceParcelsQuery,
} from '../services';
import type { ParcelSearchRow } from '../types';

export function useStorageClearanceCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialSearch = params.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [selected, setSelected] = useState<ParcelSearchRow | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [querySearch, setQuerySearch] = useState(initialSearch);
  const [searchParcels, result] = useLazySearchStorageClearanceParcelsQuery();
  const detail = useGetStorageClearanceParcelAccrualQuery(selected?.id ?? '', { skip: !selected });
  useEffect(() => {
    if (querySearch.trim().length < 2) return;
    void searchParcels({
      page: searchPage,
      pageSize: 20,
      search: querySearch.trim(),
    });
  }, [querySearch, searchPage, searchParcels]);
  const runSearch = () => {
    setQuerySearch(search);
    setSearchPage(1);
    setSelected(null);
  };
  const dailyRatePsw = detail.currentData?.dailyRatePsw ?? 0;
  const outstandingPsw = detail.currentData?.outstandingPsw ?? 0;
  return {
    search,
    setSearch,
    selected,
    setSelected,
    runSearch,
    result,
    detail,
    dailyRatePsw,
    outstandingPsw,
    accruedDays: detail.currentData?.accruedDays ?? 0,
    searchPage,
    setSearchPage,
    cancel: () => navigate('/parcels/storage-clearances'),
  };
}
