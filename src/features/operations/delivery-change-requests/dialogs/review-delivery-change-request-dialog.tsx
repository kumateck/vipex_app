import { useEffect, useState } from 'react';
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
import type { DeliveryChangeRequest } from '../types';
import { formatDeliveryChangeMoney } from '../utils';

type Props = {
  request: DeliveryChangeRequest | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (decision: 'APPROVED' | 'REJECTED', reviewNote: string) => Promise<void>;
};

export function ReviewDeliveryChangeRequestDialog(props: Props) {
  const [note, setNote] = useState('');
  useEffect(() => setNote(''), [props.request?.deliveryId]);

  return (
    <Dialog open={Boolean(props.request)} onOpenChange={(open) => (!open ? props.onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Delivery Change</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            <strong>Booking:</strong> {props.request?.bookingCode ?? '-'}
          </p>
          <p>
            <strong>Rider:</strong> {props.request?.riderName ?? '-'}
          </p>
          <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
            <div>
              <p className="font-medium">Current</p>
              <p>{props.request?.currentDropoffAddress ?? '-'}</p>
              <p>{formatDeliveryChangeMoney(props.request?.currentChargePsw)}</p>
            </div>
            <div>
              <p className="font-medium">Requested</p>
              <p>{props.request?.requestedDropoffAddress ?? '-'}</p>
              <p>{formatDeliveryChangeMoney(props.request?.requestedChargePsw)}</p>
            </div>
          </div>
          <p>
            <strong>Reason:</strong> {props.request?.reason ?? '-'}
          </p>
          <div className="space-y-2">
            <Label htmlFor="delivery-change-review-note">Review note (optional)</Label>
            <Textarea
              id="delivery-change-review-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose} disabled={props.isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={props.isSubmitting}
            onClick={() => void props.onSubmit('REJECTED', note)}
          >
            Reject
          </Button>
          <Button
            disabled={props.isSubmitting}
            onClick={() => void props.onSubmit('APPROVED', note)}
          >
            {props.isSubmitting ? 'Saving...' : 'Approve and Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
