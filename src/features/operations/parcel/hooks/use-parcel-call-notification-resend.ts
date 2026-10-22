import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { getSavedParcelCallOutcome } from '@/shared/notification-hub';
import type { ParcelSearchRow } from '../api/parcel.api';
import { useResendParcelCallNotificationMutation } from '../services';
import { getCallOutcomeNotificationFeedback } from '../utils';

export function useParcelCallNotificationResend() {
  const [parcel, setParcel] = useState<Pick<
    ParcelSearchRow,
    'id' | 'bookingCode' | 'secondReceiverId' | 'status' | 'callCenterCalledAt'
  > | null>(null);
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [includeSecondReceiver, setIncludeSecondReceiver] = useState(false);
  const [resend, { isLoading }] = useResendParcelCallNotificationMutation();
  const pending = useRef(false);
  const outcome = parcel ? getSavedParcelCallOutcome(parcel) : null;

  const open = useCallback((row: ParcelSearchRow) => {
    if (!getSavedParcelCallOutcome(row)) return;
    setParcel(row);
    setSendSms(true);
    setSendEmail(false);
    setIncludeSecondReceiver(Boolean(row.secondReceiverId));
  }, []);
  const close = useCallback(() => {
    if (!pending.current) setParcel(null);
  }, []);

  async function handleResend() {
    if (pending.current || !parcel || !outcome || (!sendSms && !sendEmail)) return;
    pending.current = true;
    try {
      const notification = await resend({
        parcelId: parcel.id,
        expectedOutcome: outcome,
        sendSms,
        sendEmail,
        includeSecondReceiver,
      }).unwrap();
      const feedback = getCallOutcomeNotificationFeedback(notification, 'resend');
      if (feedback.kind === 'warning') {
        toast.warning(feedback.message, {
          description: feedback.description,
          duration: feedback.duration,
        });
      } else if (notification.sentCount === 0) {
        toast.warning(
          'No notifications sent. Check the receivers’ contact details for the selected channels.',
        );
      } else {
        toast.success(feedback.message);
        setParcel(null);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to resend notification'));
    } finally {
      pending.current = false;
    }
  }

  return {
    open,
    isSaving: isLoading,
    dialogProps: {
      parcel,
      outcome,
      sendSms,
      onSendSmsChange: setSendSms,
      sendEmail,
      onSendEmailChange: setSendEmail,
      includeSecondReceiver,
      onIncludeSecondReceiverChange: setIncludeSecondReceiver,
      isSending: isLoading,
      onClose: close,
      onResend: handleResend,
    },
  };
}
