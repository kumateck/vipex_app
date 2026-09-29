import { useCallback, useState } from 'react';
import type { RiderDoorstepRecord } from '../../api/parcel.api';

export type RiderAssignmentListPrintPayload = {
  riderName: string;
  mode: 'current' | 'history' | 'all';
  rows: RiderDoorstepRecord[];
  printedAt: string;
};

export function useRiderAssignmentListPrint() {
  const [payload, setPayload] = useState<RiderAssignmentListPrintPayload | null>(null);
  const printList = useCallback(
    (
      riderName: string,
      mode: RiderAssignmentListPrintPayload['mode'],
      rows: RiderDoorstepRecord[],
    ) => {
      if (!riderName || rows.length === 0) return;
      setPayload({ riderName, mode, rows: [...rows], printedAt: new Date().toISOString() });
    },
    [],
  );
  const onComplete = useCallback(() => setPayload(null), []);
  return { payload, printList, onComplete };
}
