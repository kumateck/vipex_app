import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateSelfServiceSessionMutation,
  type SelfServiceSession,
} from '../api/self-service-public.api';

type SessionStatus = 'starting' | 'ready' | 'missing' | 'expired' | 'error' | 'completed';
type SessionState = {
  status: SessionStatus;
  session: SelfServiceSession | null;
  errorMessage?: string;
};

function storageKey(branchId: string) {
  return `vipex:self-service-session:${branchId}`;
}

function clearStoredSession(branchId: string) {
  try {
    window.sessionStorage.removeItem(storageKey(branchId));
  } catch {
    // The in-memory session still works when browser storage is unavailable.
  }
}

function readStoredSession(branchId: string): SessionState {
  try {
    const value = window.sessionStorage.getItem(storageKey(branchId));
    if (!value) return { status: 'missing', session: null };
    const session = JSON.parse(value) as SelfServiceSession;
    if (
      session.branchId !== branchId ||
      !session.sessionToken ||
      Date.parse(session.expiresAt) <= Date.now()
    ) {
      clearStoredSession(branchId);
      return { status: 'expired', session: null };
    }
    return { status: 'ready', session };
  } catch {
    clearStoredSession(branchId);
    return { status: 'missing', session: null };
  }
}

function apiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('data' in error)) return 'Unable to start booking.';
  const data = (error as { data?: { error?: { message?: string } } }).data;
  return data?.error?.message ?? 'Unable to start booking.';
}

export function useSelfServiceSession(branchId: string, isScanEntry: boolean) {
  const navigate = useNavigate();
  const [createSession, { isLoading }] = useCreateSelfServiceSessionMutation();
  const issuanceStarted = useRef(false);
  const [state, setState] = useState<SessionState>(() =>
    isScanEntry ? { status: 'starting', session: null } : readStoredSession(branchId),
  );

  const startSession = useCallback(async () => {
    if (!branchId || issuanceStarted.current) return;
    issuanceStarted.current = true;
    setState({ status: 'starting', session: null });
    try {
      const session = await createSession(branchId).unwrap();
      try {
        window.sessionStorage.setItem(storageKey(branchId), JSON.stringify(session));
      } catch {
        // Continue with the in-memory session.
      }
      navigate(`/self-service/${branchId}`, { replace: true });
      setState({ status: 'ready', session });
    } catch (error) {
      issuanceStarted.current = false;
      setState({ status: 'error', session: null, errorMessage: apiErrorMessage(error) });
    }
  }, [branchId, createSession, navigate]);

  useEffect(() => {
    if (isScanEntry) void startSession();
  }, [isScanEntry, startSession]);

  useEffect(() => {
    if (state.status !== 'ready' || !state.session) return;
    const remainingMs = Date.parse(state.session.expiresAt) - Date.now();
    if (remainingMs <= 0) {
      clearStoredSession(branchId);
      setState({ status: 'expired', session: null });
      return;
    }
    const timeoutId = window.setTimeout(() => {
      clearStoredSession(branchId);
      setState({ status: 'expired', session: null });
    }, remainingMs);
    return () => window.clearTimeout(timeoutId);
  }, [branchId, state]);

  const markExpired = useCallback(() => {
    clearStoredSession(branchId);
    setState({ status: 'expired', session: null });
  }, [branchId]);

  const markCompleted = useCallback(() => {
    clearStoredSession(branchId);
    setState((current) => ({ ...current, status: 'completed' }));
  }, [branchId]);

  return { ...state, isLoading, retry: startSession, markExpired, markCompleted };
}
