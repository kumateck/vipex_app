import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStorageClearanceDetail, useStorageClearanceForm } from '../hooks';
import { StorageClearanceFields } from '../components';
import type { ParcelStorageClearanceRow, ParcelStorageClearanceDetail } from '../types';
function ReviewForm({
  row,
  detail,
  onClose,
}: {
  row: ParcelStorageClearanceRow;
  detail: ParcelStorageClearanceDetail;
  onClose: () => void;
}) {
  const form = useStorageClearanceForm({
    accruedDays: detail.accruedDays,
    dailyRatePsw: detail.dailyRatePsw,
    outstandingPsw: detail.outstandingPsw,
    row,
    onDone: onClose,
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <p className="text-sm">
        Finance review reason: {row.returnNote ?? 'Review the requested days'}
      </p>
      <StorageClearanceFields form={form} />
      <DialogFooter>
        <Button type="button" variant="outline" disabled={form.isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.canSubmit}>
          {form.isSaving ? 'Submitting…' : 'Resubmit for Approval'}
        </Button>
      </DialogFooter>
    </form>
  );
}
export function StorageClearanceResubmitDialog({
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review and Resubmit Storage Clearance</DialogTitle>
        </DialogHeader>
        {detail.isFetching ? <p>Loading current accrual…</p> : null}
        {detail.isError ? (
          <p role="alert">
            Unable to load current accrual.{' '}
            <Button onClick={() => void detail.refetch()}>Retry</Button>
          </p>
        ) : null}
        {detail.data && !detail.isFetching ? (
          <ReviewForm row={row} detail={detail.data} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
