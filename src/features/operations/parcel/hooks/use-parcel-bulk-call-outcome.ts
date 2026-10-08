import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  type ParcelSearchRow,
  useSaveBulkCallOutcomeMutation,
  useSendParcelStatusCallNotificationMutation,
} from '../api/parcel.api';
import type { ContactOutcome } from '../components/parcel-status/types';
import { saveBulkCallOutcomeWithSms } from '../services/bulk-call-outcome';

export function useParcelBulkCallOutcome(onSaved: () => Promise<void>) {
  const [parcels, setParcels] = useState<ParcelSearchRow[] | null>(null);
  const [outcome, setOutcome] = useState<ContactOutcome>('follow_up');
  const [sendSms, setSendSms] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const [saveBulkCallOutcome] = useSaveBulkCallOutcomeMutation();
  const [sendNotification] = useSendParcelStatusCallNotificationMutation();

  function open(selected: ParcelSearchRow[]) {
    if (!selected.length || saving.current) return;
    setOutcome('follow_up');
    setSendSms(true);
    setParcels(selected);
  }

  function close() {
    if (!saving.current) setParcels(null);
  }

  async function save() {
    if (!parcels?.length || saving.current) return;
    saving.current = true;
    setIsSaving(true);
    try {
      const { saved, sms } = await saveBulkCallOutcomeWithSms(
        { parcelIds: parcels.map((parcel) => parcel.id), outcome, sendSms },
        (input) => saveBulkCallOutcome(input).unwrap(),
        (input) => sendNotification(input).unwrap(),
      );
      const message = `Outcome saved for ${saved.updatedCount} parcel(s)`;
      if (sms) {
        const details = `${message}. SMS sent: ${sms.sentCount}, failed: ${sms.failedCount}, skipped: ${sms.skippedCount}.`;
        if (sms.failedCount || sms.skippedCount) toast.warning(details);
        else toast.success(details);
      } else toast.success(message);
      setParcels(null);
      // Refresh errors do not turn a committed batch into a retryable save failure.
      try {
        await onSaved();
      } catch {
        toast.warning('Outcomes saved. Refresh the parcel list.');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to save bulk call outcomes');
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return {
    open,
    isSaving,
    dialogProps: {
      parcels,
      outcome,
      onOutcomeChange: setOutcome,
      sendSms,
      onSendSmsChange: setSendSms,
      onClose: close,
      onSave: save,
      isSaving,
    },
  };
}
