import { useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import {
  addSessionDelegate,
  getSessionDelegates,
  removeSessionDelegate,
  type SessionDelegates,
} from '../services';

export function useSessionDelegates(sessionId: string, visible: boolean) {
  const { withAuth } = useAuth();
  const [data, setData] = useState<SessionDelegates>({ eligible: [], assigned: [] });
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = async () => {
    try {
      const result = await withAuth((token) => getSessionDelegates(token, sessionId));
      setData(result);
      setError(null);
    } catch (caught) {
      setError(getMobileErrorMessage(caught, 'Could not load delegates'));
    }
  };
  useEffect(() => {
    if (visible && sessionId) void reload();
  }, [visible, sessionId]);
  const mutate = async (action: 'add' | 'remove', userId: string) => {
    setBusy(true);
    try {
      await withAuth((token) =>
        action === 'add'
          ? addSessionDelegate(token, sessionId, userId)
          : removeSessionDelegate(token, sessionId, userId),
      );
      setSelectedId('');
      await reload();
    } catch (caught) {
      setError(getMobileErrorMessage(caught, 'Could not update delegates'));
    } finally {
      setBusy(false);
    }
  };
  return {
    data,
    selectedId,
    setSelectedId,
    busy,
    error,
    add: () => mutate('add', selectedId),
    remove: (userId: string) => mutate('remove', userId),
  };
}
