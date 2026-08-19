import { useState } from 'react';
import { toast } from 'sonner';
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

type CloseWithExceptionsDialogProps = {
  open: boolean;
  missingCount: number;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
};

export function CloseWithExceptionsDialog({
  open,
  missingCount,
  isSaving,
  onOpenChange,
  onConfirm,
}: CloseWithExceptionsDialogProps) {
  const [reason, setReason] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isSaving) setReason('');
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close with missing parcels?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            {missingCount} parcel{missingCount === 1 ? '' : 's'} in this consignment{' '}
            {missingCount === 1 ? 'has' : 'have'} not been scanned as arrived. Closing now will flag{' '}
            {missingCount === 1 ? 'it' : 'each of them'} as a discrepancy for follow-up. A reason is
            required.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="close-exception-reason">Reason</Label>
            <Textarea
              id="close-exception-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Truck left before remaining boxes were unloaded; following up with source branch"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSaving}
            onClick={async () => {
              const trimmed = reason.trim();
              if (!trimmed) {
                toast.error('A reason is required to close with missing parcels');
                return;
              }
              await onConfirm(trimmed);
              setReason('');
            }}
          >
            {isSaving ? 'Closing...' : 'Close with exceptions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
