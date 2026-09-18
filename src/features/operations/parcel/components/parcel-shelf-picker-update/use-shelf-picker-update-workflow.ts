import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ParcelRow, StaffOption } from './shelf-picker-update-types';

type ParcelListResponse = { data: ParcelRow[]; meta: PaginationMeta };

type TableQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
};

export function useShelfPickerUpdateWorkflow() {
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState<TableQuery>({ page: 1, pageSize: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelRow | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const companyId = user?.company?.id || '';
  const branchId = user?.branch?.id || '';
  const userId = user?.id || '';
  const [listData, setListData] = useState<ParcelListResponse>({
    data: [],
    meta: {
      totalRecords: 0,
      totalPages: 0,
      page: 1,
      pageSize: 20,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchData = useCallback(async () => {
    if (!companyId || !branchId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(query.page ?? 1),
        pageSize: String(query.pageSize ?? 20),
        companyId,
        destinationId: branchId,
        ...(searchInput && { search: searchInput }),
      });
      const [parcelsRes, staffRes] = await Promise.all([
        fetch(`/api/parcels/shelf-picker?${params}`),
        fetch(`/api/branches/${branchId}/shelf-picker-staff`),
      ]);
      if (!parcelsRes.ok || !staffRes.ok) throw new Error('Failed to fetch shelf picker data');
      setListData(await parcelsRes.json());
      setStaffOptions(await staffRes.json());
    } finally {
      setIsLoading(false);
    }
  }, [branchId, companyId, query.page, query.pageSize, searchInput]);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const listQuery = { data: listData, isLoading, isFetching: isLoading, refetch: fetchData };

  const handleSearchSubmit = () => {
    setQuery((prev) => ({ ...prev, page: 1 }));
  };

  const handleUpdateShelfPicker = async () => {
    if (!selectedParcel || !selectedStaffId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/parcels/${selectedParcel.id}/update-shelf-picker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedStaffId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update shelf picker');
      }

      setSelectedParcel(null);
      setSelectedStaffId('');
      await listQuery.refetch();
    } finally {
      setIsSaving(false);
    }
  };

  return {
    context: {
      companyId,
      branchId,
      userId,
    },
    table: {
      query,
      setQuery,
      searchInput,
      setSearchInput,
      rows: listData.data,
      listQuery,
      openUpdateDialog: (parcel: ParcelRow) => {
        setSelectedParcel(parcel);
        setSelectedStaffId(parcel.shelfPickerUserId || '');
      },
      handleSearchSubmit,
    },
    dialog: {
      selectedParcel,
      setSelectedParcel,
      selectedStaffId,
      setSelectedStaffId,
      staffOptions,
      isSaving,
      handleUpdateShelfPicker,
    },
  };
}
