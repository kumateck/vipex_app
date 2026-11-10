import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';
import { useAuth } from '@mobile/providers/auth-provider';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { saveReceiverSignature, watchReceiverSignatures } from '../services';
import type { PendingReceiverHandoverRow, ReceiverHandoverPage } from '../types';

export function useReceiverSignatures(branchId: string | undefined, allowed: boolean) {
  const { withAuth } = useAuth();
  const [query, setQuery] = useState<{ search: string; after?: string }>({ search: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<{ key: string; page: ReceiverHandoverPage }>();
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [selected, setSelected] = useState<PendingReceiverHandoverRow>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const locked = useRef(false);
  const refresh = () => setRefreshKey((key) => key + 1);
  const scopeKey = JSON.stringify([branchId, query.search, query.after, refreshKey]);

  useFocusEffect(
    useCallback(() => {
      if (!allowed || !branchId) return;
      let stopped = false;
      let revision: string | undefined;
      let busy = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const load = async () => {
        if (stopped || busy || AppState.currentState === 'background') return;
        busy = true;
        let delay = 250;
        try {
          const page = await withAuth((token) =>
            watchReceiverSignatures(token, { ...query, since: revision }),
          );
          if (stopped) return;
          revision = page.revision;
          setData({ key: scopeKey, page });
          setLoadError('');
        } catch (error) {
          if (stopped) return;
          setLoadError(getMobileErrorMessage(error, 'Unable to load signatures.'));
          delay = 3_000;
        } finally {
          busy = false;
          if (!stopped) timer = setTimeout(() => void load(), delay);
        }
      };
      const appState = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          if (timer) clearTimeout(timer);
          void load();
        }
      });
      void load();
      return () => {
        stopped = true;
        if (timer) clearTimeout(timer);
        appState.remove();
      };
    }, [allowed, branchId, query, scopeKey, withAuth]),
  );

  const select = (row: PendingReceiverHandoverRow) => {
    setSaved('');
    setSaveError('');
    setSelected(row);
  };
  const submit = async (image: string) => {
    if (!selected || locked.current) return;
    locked.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await withAuth((token) => saveReceiverSignature(token, selected, image));
      setSelected(undefined);
      setSaved(
        `Signature saved for ${selected.trackingCode}. The cashier can confirm receipt on desktop.`,
      );
      refresh();
    } catch (error) {
      setSaveError(getMobileErrorMessage(error, 'Unable to save the signature. Try again.'));
    } finally {
      setSaving(false);
      locked.current = false;
    }
  };

  return {
    page: data?.key === scopeKey ? data.page : undefined,
    loadError,
    saveError,
    saved,
    selected,
    saving,
    select,
    submit,
    close: () => {
      if (!locked.current) setSelected(undefined);
    },
    search: (search: string) => setQuery({ search: search.trim() }),
    firstPage: () => setQuery({ search: query.search }),
    nextPage: (after: string) => setQuery({ ...query, after }),
    hasPrevious: Boolean(query.after),
    refresh,
  };
}
