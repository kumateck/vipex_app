import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DeliveryChangeRequestTarget } from '../types';
import { formatDeliveryChangeMoney } from '../utils';

type Props = {
  target: DeliveryChangeRequestTarget | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    requestedDropoffAddress: string;
    requestedDeliveryFeeCedis: string;
    reason: string;
  }) => Promise<void>;
};

export function DeliveryChangeRequestDialog({ target, isSubmitting, onClose, onSubmit }: Props) {
  const [address, setAddress] = useState('');
  const [fee, setFee] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setAddress(target?.currentDropoffAddress ?? '');
    setFee(target ? (target.currentChargePsw / 100).toFixed(2) : '');
    setReason('');
  }, [target?.parcelId, target?.currentChargePsw, target?.currentDropoffAddress]);

  const valid =
    address.trim().length >= 3 &&
    reason.trim().length >= 3 &&
    fee.trim().length > 0 &&
    Number.isFinite(Number(fee)) &&
    Number(fee) >= 0;

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Address and Fee Change</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border p-3 text-sm">
            <p>
              <strong>Booking:</strong> {target?.bookingCode ?? '-'}
            </p>
            <p>
              <strong>Current fee:</strong> {formatDeliveryChangeMoney(target?.currentChargePsw)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requested-delivery-address">New delivery address</Label>
            <Input
              id="requested-delivery-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requested-delivery-fee">New delivery fee (GHS)</Label>
            <Input
              id="requested-delivery-fee"
              inputMode="decimal"
              value={fee}
              onChange={(event) => setFee(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-change-reason">Reason for change</Label>
            <Textarea
              id="delivery-change-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Customer is now at a different location"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Delivery confirmation will remain unavailable until this request is reviewed.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            disabled={!valid || isSubmitting}
            onClick={() =>
              void onSubmit({
                requestedDropoffAddress: address.trim(),
                requestedDeliveryFeeCedis: fee,
                reason: reason.trim(),
              })
            }
          >
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
