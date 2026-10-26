import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ChargeApprovalsModel } from '../hooks';

export function ChargeApprovalDialog({ model }: { model: ChargeApprovalsModel }) {
  const request = model.selected;
  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) model.select(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review zero-charge correction</DialogTitle>
          <DialogDescription>
            Approval applies the charge and CREDIT status together. The parcel sender owes this
            amount in their credit account.
          </DialogDescription>
        </DialogHeader>
        {request ? (
          <div className="space-y-3 text-sm">
            <p>
              Booking: <strong>{request.bookingCode}</strong>
            </p>
            <p>
              Customer: <strong>{request.customerName}</strong>
            </p>
            <p>
              Charge: GHS 0.00 → <strong>GHS {(request.chargePsw / 100).toFixed(2)}</strong> ·
              {request.originalMethod === 4 ? 'CREDIT' : 'CASH'} → CREDIT
            </p>
            <p>Requested by: {request.requestedByName}</p>
            <p className="whitespace-pre-wrap break-words">Reason: {request.reason}</p>
            <div className="space-y-2">
              <Label htmlFor="charge-review-note">Review note (required to reject)</Label>
              <Textarea
                id="charge-review-note"
                maxLength={500}
                disabled={model.busy}
                value={model.note}
                onChange={(event) => model.setNote(event.target.value)}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={model.busy} onClick={() => model.select(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={model.busy || model.note.trim().length < 3}
            onClick={() => void model.submit(false)}
          >
            Reject
          </Button>
          <Button disabled={model.busy} onClick={() => void model.submit(true)}>
            {model.busy ? 'Saving…' : 'Approve and apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
