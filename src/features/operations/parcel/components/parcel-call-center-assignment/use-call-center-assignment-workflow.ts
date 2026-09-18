import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { ParcelRow, StaffOption } from './call-center-assignment-types';

type TableQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
};

export function useCallCenterAssignmentWorkflow() {
  const { data: session } = useSession();
  const [query, setQuery] = useState<TableQuery>({ page: 1, pageSize: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelRow | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const companyId = (session?.user as unknown as { companyId?: string })?.companyId || '';
  const branchId = (session?.user as unknown as { branchId?: string })?.branchId || '';
  const userId = session?.user?.id || '';

  const listQuery = useQuery({
    queryKey: ['call-center-parcels', query, searchInput, companyId, branchId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page ?? 1),
        pageSize: String(query.pageSize ?? 20),
        companyId,
        destinationId: branchId,
        senderPaid: 'true',
        ...(searchInput && { search: searchInput }),
      });

      const res = await fetch(`/api/parcels/call-center?${params}`);
      if (!res.ok) throw new Error('Failed to fetch parcels');
      return res.json();
    },
    enabled: !!companyId && !!branchId,
  });

  const staffQuery = useQuery({
    queryKey: ['call-center-staff', branchId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${branchId}/call-center-staff`);
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json() as Promise<StaffOption[]>;
    },
    enabled: !!branchId,
  });

  const handleSearchSubmit = (value: string) => {
    setSearchInput(value);
    setQuery((prev) => ({ ...prev, page: 1, search: value }));
  };

  const handleAssignParcel = async () => {
    if (!selectedParcel || !selectedStaffId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/parcels/${selectedParcel.id}/assign-call-center`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedStaffId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to assign parcel');
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
      isReceiverOtpRequired: false,
    },
    table: {
      query,
      setQuery,
      searchInput,
      setSearchInput,
      rows: listQuery.data?.data ?? [],
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
      staffOptions: staffQuery.data ?? [],
      isSaving,
      handleAssignParcel,
    },
  };
}
