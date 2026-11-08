import { useCallback, useEffect, useState } from 'react';
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
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [rows, setRows] = useState<PickupParcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
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
    if (!settings) return;
    const query = buildPickupListQuery(context, isPickupQueueEnabled, submittedSearch);
    if (!query) {
      setRows([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const result = await withAuth((token) => listPickupParcels(token, query));
      setRows(Array.isArray(result?.data) ? result.data : []);
      setSearched(true);
    } catch (error) {
      notifyError('Search failed', getMobileErrorMessage(error, '') || 'Unable to load parcels.');
    } finally {
      setLoading(false);
    }
  }, [context, isPickupQueueEnabled, settings, submittedSearch, withAuth]);

  useEffect(() => void load(), [load]);

  const submitSearch = useCallback(
    (term?: string) => {
      const next = (term ?? search).trim();
      if (next === submittedSearch) void load();
      else setSubmittedSearch(next);
    },
    [load, search, submittedSearch],
  );

  const searchByScan = useCallback(
    (raw: string) => {
      const code = extractScannedCode(raw);
      if (!code) return;
      setSearch(code);
      submitSearch(code);
    },
    [submitSearch],
  );

  const refresh = useCallback(async () => {
    await loadSettings();
    await load();
  }, [load, loadSettings]);

  return {
    settings,
    settingsError,
    isPickupQueueEnabled,
    isPickupOtpRequired: settings?.requirePickupOtp ?? true,
    search,
    setSearch,
    submittedSearch,
    rows,
    loading,
    searched,
    submitSearch,
    searchByScan,
    refresh,
    reload: load,
  };
}

export type OfficePickupList = ReturnType<typeof useOfficePickupList>;
