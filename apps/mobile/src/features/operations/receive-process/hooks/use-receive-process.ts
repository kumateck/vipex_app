import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from '@mobile/navigation/router-compat';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import { getParcelDetails, searchParcels } from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';
import { useAuth } from '@mobile/providers/auth-provider';
import { canMarkParcelArrived, canViewReceiveScreen } from '@mobile/lib/permissions';
import { hapticError, hapticSuccess, hapticWarning } from '@mobile/lib/haptics';
import { buildParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';
import { editIncomingParcelInformation, receiveIncomingParcel } from '../services';
import { PHONE_DIGITS, normalizePhoneDigits } from '../utils';

export function useReceiveProcess() {
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canView = canViewReceiveScreen(permissions);
  const canEdit = canMarkParcelArrived(permissions);
  const router = useRouter();
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const companyId = session.user?.company?.id ?? session.user?.companyId;

  const [busy, setBusy] = useState(false);
  const [parcel, setParcel] = useState<ParcelSearchRow | null>(null);
  const [details, setDetails] = useState<ParcelFullDetails | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [arriveBusy, setArriveBusy] = useState(false);
  const [editParcelDetails, setEditParcelDetails] = useState('');
  const [editParcelContent, setEditParcelContent] = useState('');
  const [editReceiverName, setEditReceiverName] = useState('');
  const [editReceiverPhone, setEditReceiverPhone] = useState('');
  const canConfirmArrival = parcel?.status === ParcelStatus.IN_TRANSIT && !parcel.receivedAt;

  const loadParcel = useCallback(async () => {
    if (!parcelId || !companyId) return;
    setBusy(true);
    setInitialLoading(true);
    try {
      const detailsPayload = await withAuth((token) => getParcelDetails(token, parcelId));
      setDetails(detailsPayload);

      const searchPayload = await withAuth((token) =>
        searchParcels(token, {
          search: detailsPayload.parcel.bookingCode,
          companyId,
          page: 1,
          pageSize: 20,
        }),
      );
      const row = searchPayload.data.find((item) => item.id === parcelId) ?? null;
      setParcel(row);

      setEditParcelDetails(row?.parcelDetails ?? detailsPayload.parcel.parcelDetails ?? '');
      setEditParcelContent(row?.parcelContent ?? detailsPayload.parcel.parcelContent ?? '');
      setEditReceiverName(row?.receiverName ?? '');
      setEditReceiverPhone(row?.receiverPhone ?? '');
    } catch (err) {
      notifyError(
        'Load failed',
        err instanceof Error ? err.message : 'Unable to load parcel details',
      );
      void hapticError();
    } finally {
      setBusy(false);
      setInitialLoading(false);
    }
  }, [parcelId, companyId, withAuth]);

  useEffect(() => {
    void loadParcel();
  }, [loadParcel]);

  async function saveIncomingEdits() {
    if (!parcelId || !parcel) return;
    const parcelDetailsValue = editParcelDetails.trim();
    const receiverNameValue = editReceiverName.trim();
    const receiverPhoneValue = normalizePhoneDigits(editReceiverPhone);

    if (!parcelDetailsValue) {
      Alert.alert('Validation', 'Parcel details is required.');
      void hapticWarning();
      return;
    }
    if (!receiverNameValue) {
      Alert.alert('Validation', 'Receiver name is required.');
      void hapticWarning();
      return;
    }
    if (receiverPhoneValue.length > 0 && receiverPhoneValue.length !== PHONE_DIGITS) {
      Alert.alert('Validation', `Receiver telephone must be exactly ${PHONE_DIGITS} digits.`);
      void hapticWarning();
      return;
    }
    if (!canEdit) {
      notifyError('Permission denied', 'You do not have permission to edit incoming fields.');
      void hapticWarning();
      return;
    }

    try {
      setSaveBusy(true);
      const patch = buildParcelInformationEdit(parcel, {
        parcelDetails: parcelDetailsValue,
        parcelContent: editParcelContent,
        receiverName: receiverNameValue,
        receiverPhone: receiverPhoneValue,
      });
      if (patch) await withAuth((token) => editIncomingParcelInformation(token, patch));
      notifySuccess('Incoming parcel fields updated.');
      void hapticSuccess();
      await loadParcel();
    } catch (err) {
      notifyError('Save failed', err instanceof Error ? err.message : 'Unable to save changes');
      void hapticError();
    } finally {
      setSaveBusy(false);
    }
  }

  async function markArrived() {
    if (!parcelId || !parcel) return;
    if (arriveBusy) return;
    if (!canConfirmArrival) {
      notifyError(
        'Arrival unavailable',
        'Only an unreceived In Transit parcel can be marked arrived.',
      );
      return;
    }
    if (!canEdit) {
      notifyError('Permission denied', 'You do not have permission to confirm parcel arrival.');
      void hapticWarning();
      return;
    }
    try {
      setArriveBusy(true);
      await withAuth((token) => receiveIncomingParcel(token, parcelId));
      notifySuccess(`Parcel ${parcel.bookingCode} marked ARRIVED_AT_DESTINATION.`);
      void hapticSuccess();
      router.replace('/(app)/receive');
    } catch (err) {
      notifyError(
        'Mark arrived failed',
        err instanceof Error ? err.message : 'Unable to update parcel status',
      );
      void hapticError();
    } finally {
      setArriveBusy(false);
    }
  }

  return {
    canView,
    canEdit,
    canConfirmArrival,
    router,
    busy,
    parcel,
    details,
    initialLoading,
    saveBusy,
    arriveBusy,
    editParcelDetails,
    setEditParcelDetails,
    editParcelContent,
    setEditParcelContent,
    editReceiverName,
    setEditReceiverName,
    editReceiverPhone,
    setEditReceiverPhone,
    saveIncomingEdits,
    markArrived,
  };
}
