import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStorageClearanceDetail } from '../hooks';
import { StorageClearanceSummary } from '../components';
import type { ParcelStorageClearanceRow } from '../types';
export function StorageClearanceDetailDialog({
  row,
  onClose,
}: {
  row: ParcelStorageClearanceRow;
  onClose: () => void;
}) {
  const detail = useStorageClearanceDetail(row.id);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Storage Clearance Details</DialogTitle>
        </DialogHeader>
        <StorageClearanceSummary row={row} detail={detail.data} />
        {detail.isFetching ? <p>Loading history…</p> : null}
        {detail.isError ? (
          <p role="alert">
            Unable to load history. <Button onClick={() => void detail.refetch()}>Retry</Button>
          </p>
        ) : null}
        <ol className="space-y-3 text-sm">
          {(detail.data?.history ?? []).map((entry) => (
            <li key={entry.id} className="rounded-md border p-3">
              <p>
                {entry.action.replace('PARCEL_STORAGE_CLEARANCE_', '').replaceAll('_', ' ')} ·{' '}
                {entry.actorName ?? 'Staff'}
              </p>
              <p className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
              {entry.metadata?.reason || entry.metadata?.note ? (
                <p>{String(entry.metadata.reason ?? entry.metadata.note)}</p>
              ) : null}
              {entry.metadata?.requestedDays != null ? (
                <p>Requested days: {String(entry.metadata.requestedDays)}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
