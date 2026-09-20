import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ParcelRow, StaffOption } from './call-center-assignment-types';

type ParcelListResponse = { data: ParcelRow[]; meta: PaginationMeta };

type TableQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
};

export function useCallCenterAssignmentWorkflow() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
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
        statuses: '3,12,4',
        ...(searchInput && { search: searchInput }),
      });
      const [parcelsRes, staffRes] = await Promise.all([
        fetch(`/v1/shipments/parcels?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/v1/shipments/parcels/assignment-staff', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      if (!parcelsRes.ok || !staffRes.ok) throw new Error('Failed to fetch call center data');
      setListData(await parcelsRes.json());
      setStaffOptions(await staffRes.json());
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, branchId, companyId, query.page, query.pageSize, searchInput]);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const listQuery = { data: listData, isLoading, isFetching: isLoading, refetch: fetchData };

  const handleSearchSubmit = (value: string) => {
    setSearchInput(value);
    setQuery((prev) => ({ ...prev, page: 1, search: value }));
  };

  const handleAssignParcel = async () => {
    if (!selectedParcel || !selectedStaffId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/v1/shipments/parcels/${selectedParcel.id}/assign-call-center`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ userId: selectedStaffId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to assign parcel');
      }

      setSelectedParcel(null);
      setSelectedStaffId('');
      await listQuery.refetch();
      toast.success('Parcel assigned successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign parcel');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    context: {
      companyId,
      branchId,
      userId,
      isReceiverOtpRequired: false,
    },
    table: {
      query,
      setQuery,
      searchInput,
      setSearchInput,
      rows: listData.data,
      listQuery,
      openAssignDialog: (parcel: ParcelRow) => {
        setSelectedParcel(parcel);
        setSelectedStaffId(parcel.callCenterAssignedToUserId || '');
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
      handleAssignParcel,
    },
  };
}
