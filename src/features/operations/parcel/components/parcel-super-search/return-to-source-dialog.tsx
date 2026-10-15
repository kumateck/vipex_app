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
import { useReturnToSource } from '../../hooks';

type ReturnParcel = { id: string; bookingCode: string; sourceName: string };

export function ReturnToSourceDialog({
  parcel,
  onClose,
}: {
  parcel: ReturnParcel | null;
  onClose: () => void;
}) {
  const { reason, setReason, isLoading, close, submit } = useReturnToSource(
    parcel?.id ?? null,
    onClose,
  );

  return (
    <Dialog open={Boolean(parcel)} onOpenChange={(open) => (!open ? close() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return Parcel to Source</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Record {parcel?.bookingCode} for return to {parcel?.sourceName}. This updates its status
          and stops customer delivery.
        </p>
        <div className="space-y-2">
          <Label htmlFor="return-to-source-reason">Reason</Label>
          <Textarea
            id="return-to-source-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isLoading}>
            {isLoading ? 'Recording...' : 'Record Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
