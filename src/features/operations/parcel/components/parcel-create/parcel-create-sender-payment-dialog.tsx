import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { PAYMENT_METHOD_OPTIONS } from '../parcel-sender-payments/constants';
import type { PendingSenderPaymentParcel } from './parcel-form.types';

type ParcelCreateSenderPaymentDialogProps = {
  parcels: PendingSenderPaymentParcel[];
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function ParcelCreateSenderPaymentDialog({
  parcels,
  paymentMethod,
  onPaymentMethodChange,
  isSubmitting,
  onClose,
  onSubmit,
}: ParcelCreateSenderPaymentDialogProps) {
  const totalDue = parcels.reduce((total, parcel) => total + parcel.senderDueCedis, 0);

  return (
    <Dialog open={parcels.length > 0} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect Sender Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border/70">
            {parcels.map((parcel) => (
              <div
                key={parcel.parcelId}
                className="flex items-start justify-between gap-4 border-b border-border/70 p-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{parcel.trackingCode}</p>
                  <p className="text-xs text-muted-foreground">{parcel.destinationBranchName}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  GHS {parcel.senderDueCedis.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">Total to collect</span>
            <span className="font-semibold">GHS {totalDue.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parcel-create-sender-payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger id="parcel-create-sender-payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Print Later
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Pay and Print'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
