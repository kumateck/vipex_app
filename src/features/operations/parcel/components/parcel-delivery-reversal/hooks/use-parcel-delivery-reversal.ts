import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  useListDeliveryReversalCandidatesQuery,
  useReverseParcelDeliveryMutation,
} from '../../../api/parcel.api';

export function useParcelDeliveryReversal() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const { data, isLoading, isFetching } = useListDeliveryReversalCandidatesQuery({
    page,
    pageSize: 20,
    search,
  });
  const [reverseDelivery, { isLoading: isSaving }] = useReverseParcelDeliveryMutation();

  async function confirm() {
    if (!selectedId || reason.trim().length < 5) return;
    try {
      await reverseDelivery({ id: selectedId, reason: reason.trim() }).unwrap();
      toast.success('Delivery confirmation reversed.');
      setSelectedId(null);
      setReason('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function submitSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  return {
    rows: data?.data ?? [],
    meta: data?.meta,
    isLoading: isLoading || isFetching,
    searchInput,
    setSearchInput,
    submitSearch,
    page,
    setPage,
    selectedId,
    setSelectedId,
    reason,
    setReason,
    confirm,
    isSaving,
  };
}
