import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useAuth } from '@mobile/providers/auth-provider';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import {
  collectDoorstepAddress,
  listAddressCollectionParcels,
  markReceiverCalled,
} from '../services';

export function useCallCenterFollowUp(
  canRead: boolean,
  canRecordCall: boolean,
  canCollect: boolean,
  enabled = true,
) {
  const { session, withAuth } = useAuth();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [parcels, setParcels] = useState<ParcelSearchRow[]>([]);
  const [selected, setSelected] = useState<ParcelSearchRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const userId = session.user?.id ?? session.user?.sub ?? '';

  const load = useCallback(async () => {
    if (!canRead || !enabled) return;
    setLoading(true);
    try {
      const result = await withAuth((token) =>
        listAddressCollectionParcels(token, { search: submittedSearch }),
      );
      setParcels(result.data);
    } catch (error) {
      notifyError('Follow-up unavailable', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  }, [canRead, enabled, submittedSearch, withAuth]);

  useEffect(() => void load(), [load]);

  const callReceiver = useCallback(
    async (parcel: ParcelSearchRow) => {
      if (!parcel.receiverPhone) return;
      try {
        await Linking.openURL(`tel:${parcel.receiverPhone}`);
        if (canRecordCall) {
          await withAuth((token) => markReceiverCalled(token, parcel.id, userId));
        }
      } catch (error) {
        notifyError('Call could not start', error instanceof Error ? error.message : 'Try again.');
      }
    },
    [canRecordCall, userId, withAuth],
  );

  const saveAddress = useCallback(
    async (dropoffAddress: string, deliveryFeeCedis: string) => {
      if (!selected || !canCollect) return;
      setSaving(true);
      try {
        await withAuth((token) =>
          collectDoorstepAddress(token, {
            parcelId: selected.id,
            userId,
            dropoffAddress: dropoffAddress.trim(),
            deliveryFeeCedis,
          }),
        );
        notifySuccess('The parcel is ready for supervisor dispatch.', 'Address collected');
        setSelected(null);
        await load();
      } catch (error) {
        notifyError('Address not saved', error instanceof Error ? error.message : 'Try again.');
      } finally {
        setSaving(false);
      }
    },
    [canCollect, load, selected, userId, withAuth],
  );

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
    setSelected,
    loading,
    saving,
    load,
    submitSearch,
    callReceiver,
    saveAddress,
  };
}
