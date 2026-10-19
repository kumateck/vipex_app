import { useState } from 'react';
import { toast } from 'sonner';
import {
  useApproveParcelStorageClearanceMutation,
  useExecuteParcelStorageClearanceMutation,
  useRejectParcelStorageClearanceMutation,
  useReturnParcelStorageClearanceForReviewMutation,
  useGetParcelStorageClearanceDetailQuery,
  getErrorMessage,
} from '../services';
import type { StorageClearanceAction, ParcelStorageClearanceRow } from '../types';
const TITLES = {
  approve: 'Approve Storage Clearance',
  reject: 'Reject Storage Clearance',
  return: 'Return for Requester Review',
  execute: 'Execute Storage Clearance',
};
export function useStorageClearanceAction(
  row: ParcelStorageClearanceRow,
  mode: StorageClearanceAction,
  onDone: () => void,
) {
  const [note, setNote] = useState('');
  const [approve, approveState] = useApproveParcelStorageClearanceMutation();
  const [reject, rejectState] = useRejectParcelStorageClearanceMutation();
  const [returnForReview, returnState] = useReturnParcelStorageClearanceForReviewMutation();
  const [execute, executeState] = useExecuteParcelStorageClearanceMutation();
  const detail = useGetParcelStorageClearanceDetailQuery(row.id);
  const isSaving =
    approveState.isLoading ||
    rejectState.isLoading ||
    returnState.isLoading ||
    executeState.isLoading;
  const required = mode === 'reject' || mode === 'return';
  const canSubmit =
    !isSaving && (!required || note.trim().length >= 3) && !detail.isFetching && !detail.isError;
  const submit = async () => {
    if (!canSubmit) return;
    try {
      if (mode === 'approve') await approve({ id: row.id, note: note.trim() || null }).unwrap();
      if (mode === 'reject') await reject({ id: row.id, note: note.trim() }).unwrap();
      if (mode === 'return') await returnForReview({ id: row.id, note: note.trim() }).unwrap();
      if (mode === 'execute') await execute({ id: row.id, note: note.trim() || null }).unwrap();
      toast.success(TITLES[mode]);
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not complete storage clearance action'));
    }
  };
  return { note, setNote, isSaving, canSubmit, required, title: TITLES[mode], submit, detail };
}
