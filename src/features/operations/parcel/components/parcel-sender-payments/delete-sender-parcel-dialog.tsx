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
import type { SenderCashierParcel } from '../../api/parcel.api';

type DeleteSenderParcelDialogProps = {
  parcel: SenderCashierParcel | null;
  reason: string;
  onReasonChange: (value: string) => void;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteSenderParcelDialog({
  parcel,
  reason,
  onReasonChange,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteSenderParcelDialogProps) {
  return (
    <Dialog
      open={Boolean(parcel)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Parcel (Soft Delete)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tracking: <strong>{parcel?.trackingCode ?? '-'}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="delete-parcel-reason">Reason</Label>
            <Textarea
              id="delete-parcel-reason"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Why are you deleting this parcel?"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Parcel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
