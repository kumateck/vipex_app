import { useCallback, useRef, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useAuth } from '@mobile/providers/auth-provider';
import { closeCashierSession, listCashierSessionTypes, openCashierSession } from '../services';
import type { CashierSessionActionState } from '../types';

function actionErrorMessage(error: unknown): string {
  return getMobileErrorMessage(error, 'The cashier session could not be updated.').replace(
    /\s*\(\d{3}\)$/,
    '',
  );
}

export function useCashierSessionActions(input: {
  canReadSessionTypes: boolean;
  onChanged: () => void;
}): CashierSessionActionState {
  const { canReadSessionTypes, onChanged } = input;
  const { withAuth } = useAuth();
  const [sessionTypes, setSessionTypes] = useState<CashierSessionActionState['sessionTypes']>([]);
  const [loadingSessionTypes, setLoadingSessionTypes] = useState(false);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const loadedTypes = useRef(false);

  const clearActionError = useCallback(() => setActionError(null), []);

  const loadSessionTypes = useCallback(async () => {
    if (loadedTypes.current || loadingSessionTypes) return;
    if (!canReadSessionTypes) {
      setActionError('Your role cannot read cashier session types.');
      return;
    }
    setLoadingSessionTypes(true);
    setActionError(null);
    try {
      const result = await withAuth(listCashierSessionTypes);
      setSessionTypes(result);
      loadedTypes.current = true;
    } catch (error) {
      setActionError(actionErrorMessage(error));
    } finally {
      setLoadingSessionTypes(false);
    }
  }, [canReadSessionTypes, loadingSessionTypes, withAuth]);

  const openSession = useCallback(
    async ({
      sessionTypeId,
      openingBalanceCedis,
    }: {
      sessionTypeId: string;
      openingBalanceCedis: number;
    }) => {
      if (!sessionTypeId) {
        setActionError('Please select a session type.');
        return false;
      }
      if (!Number.isFinite(openingBalanceCedis) || openingBalanceCedis < 0) {
        setActionError('Enter a valid opening balance.');
        return false;
      }
      setOpening(true);
      setActionError(null);
      try {
        await withAuth((accessToken) =>
          openCashierSession(accessToken, { sessionTypeId, openingBalanceCedis }),
        );
        onChanged();
        return true;
      } catch (error) {
        setActionError(actionErrorMessage(error));
        return false;
      } finally {
        setOpening(false);
      }
    },
    [onChanged, withAuth],
  );

  const closeSession = useCallback(
    async ({
      sessionId,
      closingBalanceCedis,
    }: {
      sessionId: string;
      closingBalanceCedis: number;
    }) => {
      setClosing(true);
      setActionError(null);
      try {
        await withAuth((accessToken) =>
          closeCashierSession(accessToken, { sessionId, closingBalanceCedis }),
        );
        onChanged();
        return true;
      } catch (error) {
        setActionError(actionErrorMessage(error));
        return false;
      } finally {
        setClosing(false);
      }
    },
    [onChanged, withAuth],
  );

  return {
    sessionTypes,
    opening,
    closing,
    loadingSessionTypes,
    actionError,
    loadSessionTypes,
    openSession,
    closeSession,
    clearActionError,
  };
}
