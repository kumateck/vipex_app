import { memo } from 'react';
import { ParcelStorageClearanceStatus as Status } from '@/db/schemas/enums';
import { cn } from '@/lib/utils';
import { describeStorageClearanceStatus, formatStorageClearanceStatus } from '../utils';

const TONES: Record<number, string> = {
  [Status.PENDING_APPROVAL]: 'border-slate-400 bg-slate-50 text-slate-700',
  [Status.APPROVED_FOR_FINANCE]: 'border-blue-500 bg-blue-50 text-blue-700',
  [Status.RETURNED_FOR_REVIEW]: 'border-amber-500 bg-amber-50 text-amber-800',
  [Status.REJECTED]: 'border-red-500 bg-red-50 text-red-700',
  [Status.EXECUTED]: 'border-emerald-500 bg-emerald-50 text-emerald-700',
};

/** One-line status pill plus what the status means for the parcel's storage balance. */
export const StorageClearanceStatusBadge = memo(function StorageClearanceStatusBadge({
  status,
}: {
  status: number;
}) {
  return (
    <div className="min-w-40 space-y-1">
      <span
        className={cn(
          'inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
          TONES[status] ?? 'border-border text-foreground',
        )}
      >
        {formatStorageClearanceStatus(status)}
      </span>
      <p className="text-xs text-muted-foreground">{describeStorageClearanceStatus(status)}</p>
    </div>
  );
});
