import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ParcelFullDetails, ParcelSearchRow } from '../../api/parcel.api';
import { formatCurrency, formatDateTime, getPaymentBucketLabel } from './parcel-pickup-queue-utils';

type PickupQueueTicketDialogProps = {
  open: boolean;
  parcel: ParcelSearchRow | null;
  parcelDetails: ParcelFullDetails | undefined;
  isPickupQueueEnabled: boolean;
  isCreatingQueue: boolean;
  onClose: () => void;
  onGenerateQueueTicket: () => void;
};

export function PickupQueueTicketDialog({
  open,
  parcel,
  parcelDetails,
  isPickupQueueEnabled,
  isCreatingQueue,
  onClose,
  onGenerateQueueTicket,
}: PickupQueueTicketDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Queue Ticket</DialogTitle>
        </DialogHeader>
        {!parcel ? null : (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm">
              <p>
                <strong>Tracking:</strong> {parcel.trackingCode}
              </p>
              <p>
                <strong>Booking:</strong> {parcel.bookingCode}
              </p>
              <p>
                <strong>Receiver:</strong> {parcel.receiverName ?? '-'} (
                {parcel.receiverPhone ?? '-'})
              </p>
              <p>
                <strong>Parcel:</strong> {parcel.parcelDetails}
              </p>
              <p>
                <strong>Payment Type:</strong> {getPaymentBucketLabel(parcel)}
              </p>
              <p>
                <strong>Receiver Due:</strong> {formatCurrency(parcel.plannedToBePaidPsw)}
              </p>
            </div>

            {parcelDetails?.pickupQueue ? (
              <div className="rounded-md border bg-muted/40 p-6 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Queue Ticket
                </p>
                <p className="mt-4 text-7xl font-black tracking-tight">
                  {parcelDetails.pickupQueue.queueCode}
                </p>
                <p className="mt-3 text-lg text-muted-foreground">
                  Queue #{parcelDetails.pickupQueue.queueNumber}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generated {formatDateTime(parcelDetails.pickupQueue.queuedAt)}
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Review the parcel details, then generate the queue ticket.
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Close
          </Button>
          {!parcelDetails?.pickupQueue ? (
            <Button
              onClick={onGenerateQueueTicket}
              disabled={isCreatingQueue || !isPickupQueueEnabled}
            >
              Issue Queue Number
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
