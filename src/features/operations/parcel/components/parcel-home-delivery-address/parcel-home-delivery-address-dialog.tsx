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
import type { ParcelSearchRow } from '../../api/parcel.api';

const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

type ParcelHomeDeliveryAddressDialogProps = {
  parcel: ParcelSearchRow | null;
  dropoffAddress: string;
  onDropoffAddressChange: (value: string) => void;
  deliveryFee: string;
  onDeliveryFeeChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

export function ParcelHomeDeliveryAddressDialog({
  parcel,
  dropoffAddress,
  onDropoffAddressChange,
  deliveryFee,
  onDeliveryFeeChange,
  isSaving,
  onClose,
  onSubmit,
}: ParcelHomeDeliveryAddressDialogProps) {
  return (
    <Dialog open={Boolean(parcel)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Address + Delivery Fee</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">
            <strong>Booking:</strong> {parcel?.bookingCode}
          </p>
          <p className="text-sm">
            <strong>To Be Paid:</strong>{' '}
            {parcel
              ? formatCurrency(parcel.outstandingPrincipalPsw ?? parcel.plannedToBePaidPsw)
              : '-'}
          </p>
          <div className="space-y-2">
            <Label htmlFor="dropoff-address">Home Address</Label>
            <Input
              id="dropoff-address"
              value={dropoffAddress}
              onChange={(event) => onDropoffAddressChange(event.target.value)}
              placeholder="Enter full home address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-fee">Delivery Fee (GHS)</Label>
            <Input
              id="delivery-fee"
              inputMode="decimal"
              value={deliveryFee}
              onChange={(event) => onDeliveryFeeChange(event.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Confirm Address Collected'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
