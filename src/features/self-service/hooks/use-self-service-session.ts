import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateSelfServiceSessionMutation,
  type SelfServiceSession,
  type SubmitSelfServiceDraftResponse,
} from '../api/self-service-public.api';
import {
  clearSelfServiceSession,
  readSelfServiceSession,
  saveSelfServiceSession,
  hasSelfServiceScanLimit,
  setSelfServiceScanLimit,
} from '../utils';

type SessionState = {
  status: 'starting' | 'ready' | 'expired' | 'error' | 'completed' | 'limit';
  session: SelfServiceSession | null;
  errorMessage?: string;
  nextSession?: SelfServiceSession | null;
};

function apiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('data' in error)) return 'Unable to start booking.';
  const data = (error as { data?: { error?: { message?: string } } }).data;
  return data?.error?.message ?? 'Unable to start booking.';
}

export function useSelfServiceSession(branchId: string, isScanEntry: boolean) {
  const navigate = useNavigate();
  const [createSession, { isLoading }] = useCreateSelfServiceSessionMutation();
  const issuing = useRef(false);
  const entryHandled = useRef(false);
  const previousScanEntry = useRef(isScanEntry);
  const mounted = useRef(true);
  const [state, setState] = useState<SessionState>(() => {
    if (!isScanEntry && hasSelfServiceScanLimit(branchId))
      return { status: 'limit', session: null };
    const session = isScanEntry ? null : readSelfServiceSession(branchId);
    return { status: session ? 'ready' : 'starting', session };
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const startSession = useCallback(async () => {
    if (!branchId || issuing.current) return;
    if (!isScanEntry && hasSelfServiceScanLimit(branchId)) {
      setState({ status: 'limit', session: null });
      return;
    }
    if (isScanEntry) setSelfServiceScanLimit(branchId, false);
    issuing.current = true;
    clearSelfServiceSession(branchId);
    setState({ status: 'starting', session: null });
    try {
      const session = await createSession(branchId).unwrap();
      if (!mounted.current) return;
      saveSelfServiceSession(session);
      navigate(`/self-service/${encodeURIComponent(branchId)}`, { replace: true });
      setState({ status: 'ready', session });
    } catch (error) {
      if (!mounted.current) return;
      setState({ status: 'error', session: null, errorMessage: apiErrorMessage(error) });
    } finally {
      issuing.current = false;
    }
  }, [branchId, createSession, isScanEntry, navigate]);

  useEffect(() => {
    const newScan = isScanEntry && !previousScanEntry.current;
    previousScanEntry.current = isScanEntry;
    if (entryHandled.current) {
      if (newScan) void startSession();
      return;
    }
    entryHandled.current = true;
    if (state.status === 'starting') void startSession();
  }, [isScanEntry, startSession, state.status]);

  const markExpired = useCallback(() => {
    clearSelfServiceSession(branchId);
    setState({ status: 'expired', session: null });
  }, [branchId]);

  const markCompleted = useCallback(
    (response: SubmitSelfServiceDraftResponse) => {
      if (response.bookingsCompleted >= 10) setSelfServiceScanLimit(branchId, true);
      if (response.nextSession) saveSelfServiceSession(response.nextSession);
      else clearSelfServiceSession(branchId);
      setState((current) => ({
        ...current,
        status: 'completed',
        nextSession: response.nextSession,
      }));
    },
    [branchId],
  );

  const continueBooking = useCallback(() => {
    setState((current) =>
      current.nextSession ? { status: 'ready', session: current.nextSession } : current,
    );
  }, []);

  return { ...state, isLoading, retry: startSession, markExpired, markCompleted, continueBooking };
}
