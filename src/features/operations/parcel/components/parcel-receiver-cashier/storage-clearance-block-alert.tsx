import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { STORAGE_CLEARANCE_STATUS_LABELS } from '../parcel-storage-clearance/constants';

/** Explains why handover is blocked while a storage clearance is still open. */
export const StorageClearanceBlockAlert = memo(function StorageClearanceBlockAlert({
  status,
}: {
  status: number;
}) {
  const label = STORAGE_CLEARANCE_STATUS_LABELS[status] ?? 'Open';
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-md border border-amber-500/60 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">Storage fee clearance in progress ({label})</p>
        <p>
          Do not collect storage for this parcel. Handover is blocked until finance executes or
          rejects the clearance request.
        </p>
      </div>
    </div>
  );
});
