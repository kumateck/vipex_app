import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { ParcelStatus } from '@/db/schemas/enums';
import { useResolveSecondReceiverMutation } from '@/features/customers/api';
import {
  type ParcelSearchRow,
  useRecordCallCenterContactMutation,
  useSendParcelStatusCallNotificationMutation,
} from '../api/parcel.api';
import type { ContactOutcome } from '../components/parcel-status/types';
import { useMainReceiverChange } from '../components/parcel-status/use-main-receiver-change';

export function useParcelCallOutcome(refreshQueues: () => Promise<void>) {
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [outcome, setOutcome] = useState<ContactOutcome>('follow_up');
  const [useSecondReceiver, setUseSecondReceiver] = useState(false);
  const [secondReceiverName, setSecondReceiverName] = useState('');
  const [secondReceiverPhone, setSecondReceiverPhone] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const mainReceiverChange = useMainReceiverChange(Boolean(selectedParcel));

  const [recordContact, { isLoading: isRecordingContact }] = useRecordCallCenterContactMutation();
  const [resolveSecondReceiver, { isLoading: isCreatingCustomer }] =
    useResolveSecondReceiverMutation();
  const [sendCallNotification, { isLoading: isSendingNotification }] =
    useSendParcelStatusCallNotificationMutation();

  const isSaving =
    isCreatingCustomer ||
    isSendingNotification ||
    isRecordingContact ||
    mainReceiverChange.isSaving;
  const openCallOutcome = (parcel: ParcelSearchRow) => {
    setSelectedParcel(parcel);
    setOutcome(
      parcel.status === ParcelStatus.HOME_DELIVERY_REQUESTED
        ? 'delivery'
        : parcel.status === ParcelStatus.AWAITING_PICKUP
          ? 'pickup'
          : 'follow_up',
    );
    setUseSecondReceiver(false);
    setSecondReceiverName('');
    setSecondReceiverPhone('');
    setSendSms(true);
    setSendEmail(false);
    mainReceiverChange.reset();
  };

  async function handleSaveOutcome() {
    if (!selectedParcel) return;

    let secondReceiverId = selectedParcel.secondReceiverId ?? null;

    if (useSecondReceiver && !mainReceiverChange.enabled) {
      const name = secondReceiverName.trim();
      const phone = normalizePhoneDigits(secondReceiverPhone);
      if (name.length === 0 || phone.length === 0) {
        toast.error('Second receiver name and telephone are required');
        return;
      }
      if (!isTenDigitPhone(phone)) {
        toast.error(phoneLengthMessage('Second receiver telephone'));
        return;
      }
      const created = await resolveSecondReceiver({
        fullname: name,
        telephone: phone,
      }).unwrap();
      secondReceiverId = created.id;
    }

    try {
      if (mainReceiverChange.enabled) {
        await mainReceiverChange.save({ parcelId: selectedParcel.id, outcome });
        secondReceiverId = null;
      } else {
        await recordContact({
          id: selectedParcel.id,
          outcome,
          secondReceiverId,
        }).unwrap();
      }
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save call outcome');
      return;
    }

    if (sendSms || sendEmail) {
      try {
        const notification = await sendCallNotification({
          parcelId: selectedParcel.id,
          outcome,
          sendSms,
          sendEmail,
          includeSecondReceiver:
            !mainReceiverChange.enabled && (useSecondReceiver || Boolean(secondReceiverId)),
        }).unwrap();
        if (notification.failedCount > 0) {
          toast.warning(
            `Outcome saved. Notifications sent: ${notification.sentCount}, failed: ${notification.failedCount}.`,
          );
        } else {
          toast.success(`Outcome saved. Notifications sent: ${notification.sentCount}.`);
        }
      } catch (error) {
        toast.warning(
          `Outcome saved, but notification failed: ${getApplicationErrorMessage(error, '') || 'Please try again later'}`,
        );
      }
    } else {
      toast.success('Parcel contact outcome saved');
    }

    setSelectedParcel(null);
    await refreshQueues();
  }

  return {
    open: openCallOutcome,
    isSaving,
    dialogProps: {
      selectedParcel,
      outcome,
      onOutcomeChange: setOutcome,
      useSecondReceiver,
      onUseSecondReceiverChange: setUseSecondReceiver,
      secondReceiverName,
      onSecondReceiverNameChange: setSecondReceiverName,
      secondReceiverPhone,
      onSecondReceiverPhoneChange: setSecondReceiverPhone,
      sendSms,
      onSendSmsChange: setSendSms,
      sendEmail,
      onSendEmailChange: setSendEmail,
      isSaving,
      mainReceiverChange,
      onClose: () => setSelectedParcel(null),
      onSave: handleSaveOutcome,
    },
  };
}
