import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';
import { useAuth } from '@mobile/providers/auth-provider';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import type {
  BatchSignaturePage,
  BatchSignatureRow,
} from '@/shared/shipments/batch-signature-request';
import { listBatchSignatures, saveBatchSignature } from '../services';

export function useBatchSignatures(branchId: string | undefined, search: string, allowed: boolean) {
  const { withAuth } = useAuth();
  const [cursor, setCursor] = useState<{ search: string; after?: string }>({ search });
  const after = cursor.search === search ? cursor.after : undefined;
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([branchId, search, after, revision]);
  const [data, setData] = useState<{ key: string; page: BatchSignaturePage }>();
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<BatchSignatureRow>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState('');
  const locked = useRef(false);
  const refresh = () => setRevision((value) => value + 1);

  useFocusEffect(
    useCallback(() => {
      if (!allowed || !branchId) return;
      let stopped = false;
      let busy = false;
      const load = async () => {
        if (stopped || busy || AppState.currentState === 'background') return;
        busy = true;
        try {
          const page = await withAuth((token) => listBatchSignatures(token, { search, after }));
          if (!stopped) {
            setData({ key, page });
            setError('');
          }
        } catch (failure) {
          if (!stopped) setError(getMobileErrorMessage(failure, 'Unable to load batch signatures'));
        } finally {
          busy = false;
        }
      };
      const timer = setInterval(() => void load(), 4000);
      const listener = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          void load();
        }
      });
      void load();
      return () => {
        stopped = true;
        clearInterval(timer);
        listener.remove();
      };
    }, [after, allowed, branchId, key, search, withAuth]),
  );

  return {
    page: data?.key === key ? data.page : undefined,
    error,
    selected,
    saving,
    saveError,
    saved,
    refresh,
    hasPrevious: Boolean(after),
    changePage: (after?: string) => setCursor({ search, after }),
    select: (row: BatchSignatureRow) => {
      setSelected(row);
      setSaveError('');
      setSaved('');
    },
    close: () => {
      if (!locked.current) setSelected(undefined);
    },
    submit: async (image: string) => {
      if (!selected || locked.current) return;
      locked.current = true;
      setSaving(true);
      setSaveError('');
      try {
        await withAuth((token) =>
          saveBatchSignature(token, selected.id, selected.requestId, image),
        );
        setSaved(
          `Signature saved for ${selected.parcels.length} parcels. The initiating operator can confirm the handover.`,
        );
        setSelected(undefined);
        refresh();
      } catch (failure) {
        setSaveError(getMobileErrorMessage(failure, 'Unable to save the batch signature'));
      } finally {
        locked.current = false;
        setSaving(false);
      }
    },
  };
}
