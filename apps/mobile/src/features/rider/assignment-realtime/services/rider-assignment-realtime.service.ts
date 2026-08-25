import { listRiderParcels } from '@mobile/lib/api';
import type { RiderAssignmentSignal } from '../types';

type AssignmentListener = (signal: RiderAssignmentSignal) => void;
const listeners = new Set<AssignmentListener>();

export function fetchCurrentRiderAssignments(token: string, riderUserId: string) {
  return listRiderParcels(token, riderUserId, 'current');
}

export function publishRiderAssignmentSignal(signal: RiderAssignmentSignal) {
  for (const listener of listeners) listener(signal);
}

export function subscribeToRiderAssignmentSignals(listener: AssignmentListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
