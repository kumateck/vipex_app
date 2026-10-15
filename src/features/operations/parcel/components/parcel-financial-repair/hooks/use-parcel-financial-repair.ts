import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  useLazyPreviewParcelFinancialRepairQuery,
  useRepairParcelFinancialStateMutation,
} from '../../../api/parcel.api';

export function useParcelFinancialRepair() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [preview, previewState] = useLazyPreviewParcelFinancialRepairQuery();
  const [repair, repairState] = useRepairParcelFinancialStateMutation();

  async function findParcel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = searchInput.trim();
    if (value.length < 3) return;
    setSearch(value);
    setReason('');
    try {
      await preview({ search: value }).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function applyRepair() {
    if (!search || reason.trim().length < 5 || !previewState.data?.needsRepair) return;
    try {
      const result = await repair({ search, reason: reason.trim() }).unwrap();
      toast.success(`${result.bookingCode} To Be Paid amount repaired.`);
      setReason('');
      void preview({ search });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return {
    searchInput,
    setSearchInput,
    findParcel,
    preview: previewState.currentData,
    isLoading: previewState.isLoading || previewState.isFetching,
    reason,
    setReason,
    applyRepair,
    isSaving: repairState.isLoading,
  };
}
