import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useAuth } from '@mobile/providers/auth-provider';
import { notifyError, notifySuccess, notifyWarning } from '@mobile/lib/notify';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import { listAssignedCallParcels, outcomeStatus, saveCallOutcome } from '../services';
import type { ContactOutcome } from '../types';
import { getDialUrl, normalizePhone, validateSecondReceiver } from '../utils';

export function useAssignedCallOutcomes(enabled: boolean) {
  const { withAuth } = useAuth();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [parcels, setParcels] = useState<ParcelSearchRow[]>([]);
  const [selected, setSelected] = useState<ParcelSearchRow | null>(null);
  const [outcome, setOutcome] = useState<ContactOutcome>('follow_up');
  const [useSecondReceiver, setUseSecondReceiver] = useState(false);
  const [secondReceiverName, setSecondReceiverName] = useState('');
  const [secondReceiverPhone, setSecondReceiverPhone] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const result = await withAuth((token) => listAssignedCallParcels(token, submittedSearch));
      setParcels(result.data);
    } catch (error) {
      notifyError('Assigned calls unavailable', getMobileErrorMessage(error, '') || 'Try again.');
    } finally {
      setLoading(false);
    }
  }, [enabled, submittedSearch, withAuth]);

  useEffect(() => void load(), [load]);

  const openOutcome = useCallback((parcel: ParcelSearchRow) => {
    setSelected(parcel);
    setOutcome('follow_up');
    setUseSecondReceiver(false);
    setSecondReceiverName('');
    setSecondReceiverPhone('');
    setSendSms(true);
    setSendEmail(false);
  }, []);

  const closeOutcome = useCallback(() => {
    if (!saving) setSelected(null);
  }, [saving]);

  const callPhone = useCallback(async (phone: string | null | undefined) => {
    const dialUrl = phone ? getDialUrl(phone) : null;
    if (!dialUrl) return;
    try {
      await Linking.openURL(dialUrl);
    } catch (error) {
      notifyError('Call could not start', getMobileErrorMessage(error, '') || 'Try again.');
    }
  }, []);

  const callReceiver = useCallback(
    () => callPhone(selected?.receiverPhone),
    [callPhone, selected?.receiverPhone],
  );

  const saveOutcome = useCallback(async () => {
    if (!selected) return;
    const validation = validateSecondReceiver(
      outcome === 'pickup' && useSecondReceiver,
      secondReceiverName,
      secondReceiverPhone,
    );
    if (validation) return notifyError('Check second receiver', validation);

    setSaving(true);
    try {
      const result = await withAuth((token) =>
        saveCallOutcome(token, {
          parcelId: selected.id,
          status: outcomeStatus(outcome),
          outcome,
          sendSms,
          sendEmail,
          existingSecondReceiverId: selected.secondReceiverId ?? null,
          secondReceiver:
            outcome === 'pickup' && useSecondReceiver
              ? {
                  fullname: secondReceiverName.trim(),
                  telephone: normalizePhone(secondReceiverPhone),
                }
              : null,
        }),
      );
      if (result.notificationError) {
        notifyWarning(
          'Outcome saved, but the notification could not be sent.',
          'Notification failed',
        );
      } else if (result.failedCount > 0) {
        notifyWarning(
          `Outcome saved. Sent ${result.sentCount}; failed ${result.failedCount}.`,
          'Some notifications failed',
        );
      } else {
        notifySuccess('The receiver outcome was saved.', 'Outcome saved');
      }
      setSelected(null);
      await load();
    } catch (error) {
      notifyError('Outcome not saved', getMobileErrorMessage(error, '') || 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [
    load,
    outcome,
    secondReceiverName,
    secondReceiverPhone,
    selected,
    sendEmail,
    sendSms,
    useSecondReceiver,
    withAuth,
  ]);

  const submitSearch = useCallback(() => {
    const next = search.trim();
    if (next === submittedSearch) void load();
    else setSubmittedSearch(next);
  }, [load, search, submittedSearch]);

  return {
    search,
    setSearch,
    parcels,
    selected,
    outcome,
    setOutcome,
    useSecondReceiver,
    setUseSecondReceiver,
    secondReceiverName,
    setSecondReceiverName,
    secondReceiverPhone,
    setSecondReceiverPhone: (value: string) => setSecondReceiverPhone(normalizePhone(value)),
    sendSms,
    setSendSms,
    sendEmail,
    setSendEmail,
    loading,
    saving,
    openOutcome,
    closeOutcome,
    callReceiver,
    callPhone,
    saveOutcome,
    submitSearch,
  };
}
