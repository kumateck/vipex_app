import { useEffect, useMemo, useState } from 'react';
import { CustomerType, useListCustomersQuery } from '@/features/customers/api';

export function useCustomerList() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [customerType, setCustomerType] = useState(CustomerType.Individual);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const query = useMemo(
    () => ({
      page,
      pageSize: 30,
      search: search.trim() || undefined,
      filters: { includeDeleted: false, customerType },
      sort: [{ field: 'createdAt', direction: 'desc' as const }],
    }),
    [page, search, customerType],
  );
  const result = useListCustomersQuery(query);
  const updateSearch = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };
  const changeType = (value: string) => {
    setCustomerType(Number(value) as CustomerType);
    setPage(1);
  };
  return {
    ...result,
    data: result.currentData,
    searchInput,
    updateSearch,
    page,
    setPage,
    customerType,
    changeType,
  };
}
