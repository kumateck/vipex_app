import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStorageClearanceAction } from '../hooks';
import { StorageClearanceSummary } from '../components';
import type { ParcelStorageClearanceRow, StorageClearanceAction } from '../types';
export function StorageClearanceActionDialog({
  row,
  mode,
  onClose,
}: {
  row: ParcelStorageClearanceRow;
  mode: StorageClearanceAction;
  onClose: () => void;
}) {
  const state = useStorageClearanceAction(row, mode, onClose);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !state.isSaving) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
        </DialogHeader>
        <StorageClearanceSummary row={row} detail={state.detail.data} />
        {state.detail.isFetching ? <p>Loading current accrual…</p> : null}
        {state.detail.isError ? (
          <p role="alert" className="text-destructive">
            Unable to load current accrual.{' '}
            <Button onClick={() => void state.detail.refetch()}>Retry</Button>
          </p>
        ) : null}
        <Label htmlFor="clearance-action-note">
          {state.required ? 'Reason (required)' : 'Note (optional)'}
        </Label>
        <Textarea
          id="clearance-action-note"
          value={state.note}
          disabled={state.isSaving}
          onChange={(event) => state.setNote(event.target.value)}
          maxLength={1000}
        />
        <DialogFooter>
          <Button variant="outline" disabled={state.isSaving} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!state.canSubmit} onClick={() => void state.submit()}>
            {state.isSaving ? 'Saving…' : state.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
