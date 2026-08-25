import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import { canViewRiderScreen } from '@mobile/lib/permissions';
import { hapticSuccess } from '@mobile/lib/haptics';
import { notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { fetchCurrentRiderAssignments, publishRiderAssignmentSignal } from '../services';
import type { RiderAssignmentSocketPayload } from '../types';
import { getRiderAssignmentNotice } from '../utils';

const ASSIGNMENT_POLL_INTERVAL_MS = 5 * 60 * 1000;

export function useRiderAssignmentRealtime() {
  const { session, withAuth } = useAuth();
  const riderUserId = session.user?.id ?? session.user?.sub ?? '';
  const canView = canViewRiderScreen(session.user?.permissions);
  const knownParcelIds = useRef<Set<string> | null>(null);

  const announce = useCallback((count: number) => {
    if (count < 1) return;
    notifySuccess(getRiderAssignmentNotice(count), 'New delivery assignment');
    void hapticSuccess();
  }, []);

  const reconcile = useCallback(async () => {
    if (!canView || !riderUserId) return;
    try {
      const response = await withAuth((token) => fetchCurrentRiderAssignments(token, riderUserId));
      const nextIds = new Set(response.rows.map((row) => row.parcelId));
      const previousIds = knownParcelIds.current;
      knownParcelIds.current = nextIds;
      const newIds = previousIds
        ? [...nextIds].filter((parcelId) => !previousIds.has(parcelId))
        : [];
      announce(newIds.length);
      publishRiderAssignmentSignal({
        source: 'poll',
        riderUserId,
        parcelIds: newIds,
        assignedAt: new Date().toISOString(),
      });
    } catch {
      // The visible rider screens surface API failures; this background safety check stays quiet.
    }
  }, [announce, canView, riderUserId, withAuth]);

  const handleSocketAssignment = useCallback(
    (payload: RiderAssignmentSocketPayload) => {
      if (!riderUserId || payload.riderUserId !== riderUserId) return;
      const previousIds = knownParcelIds.current;
      const known = previousIds ?? new Set<string>();
      const newIds = payload.parcelIds.filter((parcelId) => !known.has(parcelId));
      for (const parcelId of payload.parcelIds) known.add(parcelId);
      knownParcelIds.current = known;
      announce(previousIds ? newIds.length : payload.parcelIds.length);
      publishRiderAssignmentSignal({ ...payload, source: 'socket' });
    },
    [announce, riderUserId],
  );

  const socketOptions = useMemo(
    () => ({ onRiderAssigned: handleSocketAssignment }),
    [handleSocketAssignment],
  );
  useCommunicationSocket(canView ? session.accessToken : null, socketOptions);

  useEffect(() => {
    if (!canView || !riderUserId) {
      knownParcelIds.current = null;
      return;
    }
    void reconcile();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void reconcile();
    }, ASSIGNMENT_POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reconcile();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [canView, reconcile, riderUserId]);
}
