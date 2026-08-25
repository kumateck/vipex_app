import type { PropsWithChildren } from 'react';
import { useRiderAssignmentRealtime } from '../../hooks';

export function RiderAssignmentRealtimeProvider({ children }: PropsWithChildren) {
  useRiderAssignmentRealtime();
  return children;
}
