import { useState } from 'react';
import { toast } from 'sonner';
import {
  useCreateParcelStorageClearanceMutation,
  useResubmitParcelStorageClearanceMutation,
  getErrorMessage,
} from '../services';
import type { ParcelStorageClearanceRow } from '../types';

export function useStorageClearanceForm({
  accruedDays,
  dailyRatePsw,
  outstandingPsw,
  parcelId,
  row,
  onDone,
}: {
  accruedDays: number;
  dailyRatePsw: number;
  outstandingPsw: number;
  parcelId?: string;
  row?: ParcelStorageClearanceRow;
  onDone: () => void;
}) {
  const [form, setForm] = useState(() => ({
    days: String(row?.requestedDays ?? ''),
    clearAll: row?.clearAll ?? false,
    reason: row?.reason ?? '',
    evidenceUrl: row?.evidenceUrl ?? '',
  }));
  const [create, createState] = useCreateParcelStorageClearanceMutation();
  const [resubmit, resubmitState] = useResubmitParcelStorageClearanceMutation();
  const requestedDays = form.clearAll ? accruedDays : Number(form.days);
  const requestedAmountPsw = form.clearAll ? outstandingPsw : requestedDays * dailyRatePsw;
  const remainingDays = Math.max(accruedDays - requestedDays, 0);
  const isSaving = createState.isLoading || resubmitState.isLoading;
  const canSubmit =
    !isSaving &&
    accruedDays > 0 &&
    Number.isInteger(requestedDays) &&
    requestedDays > 0 &&
    requestedDays <= 2147483647 &&
    form.reason.trim().length >= 3;
  const update = (patch: Partial<typeof form>) =>
    setForm((previous) => ({ ...previous, ...patch }));
  const submit = async () => {
    if (!canSubmit || (!parcelId && !row)) return;
    const body = {
      requestedDays,
      clearAll: form.clearAll,
      reason: form.reason.trim(),
      evidenceUrl: form.evidenceUrl.trim() || null,
    };
    try {
      if (row) await resubmit({ ...body, id: row.id }).unwrap();
      else await create({ ...body, parcelId: parcelId! }).unwrap();
      toast.success(
        row
          ? 'Storage clearance resubmitted for approval'
          : 'Storage clearance submitted for approval',
      );
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit storage clearance'));
    }
  };
  return {
    ...form,
    accruedDays,
    dailyRatePsw,
    outstandingPsw,
    requestedDays,
    requestedAmountPsw,
    remainingDays,
    isSaving,
    canSubmit,
    update,
    submit,
  };
}
