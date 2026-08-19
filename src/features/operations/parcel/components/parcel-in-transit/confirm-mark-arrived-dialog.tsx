import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ParcelSearchRow } from '../../api/parcel.api';

type ConfirmMarkArrivedDialogProps = {
  parcel: ParcelSearchRow | null;
  isConfirming: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmMarkArrivedDialog({
  parcel,
  isConfirming,
  onCancel,
  onConfirm,
}: ConfirmMarkArrivedDialogProps) {
  return (
    <AlertDialog
      open={Boolean(parcel)}
      onOpenChange={(open) => {
        if (!open && !isConfirming) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm parcel arrival?</AlertDialogTitle>
          <AlertDialogDescription>
            This records the parcel as received at your branch and moves it to the receiver handling
            queue.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {parcel ? (
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <p>
              <strong>Booking:</strong> {parcel.bookingCode}
            </p>
            <p>
              <strong>Receiver:</strong> {parcel.receiverName ?? '-'}
            </p>
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Cancel</AlertDialogCancel>
          <Button type="button" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Marking Arrived...' : 'Confirm Arrival'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
