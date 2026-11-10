import { useCallback, useEffect, useRef, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError } from '@mobile/lib/notify';
import { extractScannedCode } from '@mobile/lib/scan-code';
import { useAuth } from '@mobile/providers/auth-provider';
import { getBranchPickupSettings, listPickupParcels } from '../services';
import type { BranchPickupSettings, PickupContext, PickupParcel } from '../types';
import { buildPickupListQuery } from '../utils';

/**
 * Branch pickup settings plus the list of sender-paid parcels ready for
 * office pickup, found by search or by scanning the parcel sticker.
 */
export function useOfficePickupList(context: PickupContext, enabled: boolean) {
  const { withAuth } = useAuth();
  const [settings, setSettings] = useState<BranchPickupSettings | null>(null);
  const [settingsError, setSettingsError] = useState(false);
  const [search, setSearch] = useState('');
  const [lookup, setLookup] = useState({ term: '', exactCode: false });
  const [rows, setRows] = useState<PickupParcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestId = useRef(0);
  const { branchId } = context;

  const loadSettings = useCallback(async () => {
    if (!enabled || !branchId) return;
    setSettingsError(false);
    try {
      setSettings(await withAuth((token) => getBranchPickupSettings(token, branchId)));
    } catch (error) {
      setSettingsError(true);
      notifyError(
        'Branch settings unavailable',
        getMobileErrorMessage(error, '') || 'Unable to load pickup settings for your branch.',
      );
    }
  }, [branchId, enabled, withAuth]);

  useEffect(() => void loadSettings(), [loadSettings]);

  const isPickupQueueEnabled = settings?.usePickupQueue ?? false;

  const load = useCallback(async () => {
    if (!enabled || !settings) return;
    const id = ++requestId.current;
    const query = buildPickupListQuery(
      context,
      isPickupQueueEnabled,
      lookup.term,
      lookup.exactCode,
    );
    try {
      if (!query) {
        setRows([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      const result = await withAuth((token) => listPickupParcels(token, query));
      if (id !== requestId.current) return;
      const matches = Array.isArray(result?.data) ? result.data : [];
      const { parcelCode } = query;
      setRows(
        parcelCode
          ? matches.filter(
              (row) => row.trackingCode === parcelCode || row.bookingCode === parcelCode,
            )
          : matches,
      );
      setSearched(true);
    } catch (error) {
      if (id !== requestId.current) return;
      setRows([]);
      notifyError('Search failed', getMobileErrorMessage(error, '') || 'Unable to load parcels.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [context, enabled, isPickupQueueEnabled, lookup, settings, withAuth]);

  useEffect(() => void load(), [load]);

  const submitLookup = useCallback(
    (term: string, exactCode: boolean) => {
      if (term === lookup.term && exactCode === lookup.exactCode) {
        void load();
        return;
      }
      requestId.current += 1;
      setRows([]);
      setSearched(false);
      setLookup({ term, exactCode });
    },
    [load, lookup],
  );
  const submitSearch = useCallback(
    () => submitLookup(search.trim(), false),
    [search, submitLookup],
  );

  const searchByScan = useCallback(
    (raw: string) => {
      const code = extractScannedCode(raw);
      if (!code || code.length > 255) {
        notifyError(
          'Sticker not recognized',
          'Scan the parcel sticker or enter its code manually.',
        );
        return;
      }
      setSearch(code);
      submitLookup(code, true);
    },
    [submitLookup],
  );

  return {
    settings,
    settingsError,
    isPickupQueueEnabled,
    isPickupOtpRequired: settings?.requirePickupOtp ?? true,
    search,
    setSearch,
    rows,
    loading,
    searched,
    submitSearch,
    searchByScan,
    refresh: loadSettings,
    reload: load,
  };
}

export type OfficePickupList = ReturnType<typeof useOfficePickupList>;
