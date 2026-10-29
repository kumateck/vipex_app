import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useAuthStore } from '@/stores/auth-store';
import { useListChargeCorrectionsQuery, useReviewChargeCorrectionMutation } from '../services';
import type { ChargeCorrection } from '../types';

export function useChargeApprovals() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const cacheScope = `${user?.company?.id ?? ''}:${userId ?? ''}`;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const query = useListChargeCorrectionsQuery(
    { page, search: search.trim() || undefined, cacheScope },
    { refetchOnMountOrArgChange: true },
  );
  const [review, state] = useReviewChargeCorrectionMutation();
  const [selected, setSelected] = useState<ChargeCorrection | null>(null);
  const [note, setNote] = useState('');
  const submitting = useRef(false);
  const select = (row: ChargeCorrection | null) => {
    if (submitting.current) return;
    setSelected(row);
    setNote('');
  };
  const submit = async (approve: boolean) => {
    if (
      !selected ||
      submitting.current ||
      selected.requestedBy === userId ||
      (!approve && note.trim().length < 3)
    )
      return;
    submitting.current = true;
    try {
      await review({ id: selected.id, approve, note: note.trim() || undefined }).unwrap();
      toast.success(
        approve
          ? 'Approved: parcel charge and CREDIT debt applied.'
          : 'Charge correction rejected.',
      );
      setSelected(null);
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Could not review the charge correction');
    } finally {
      submitting.current = false;
    }
  };
  return {
    query,
    page,
    setPage,
    searchInput,
    setSearchInput,
    selected,
    select,
    note,
    setNote,
    submit,
    busy: state.isLoading,
    userId,
  };
}
export type ChargeApprovalsModel = ReturnType<typeof useChargeApprovals>;
