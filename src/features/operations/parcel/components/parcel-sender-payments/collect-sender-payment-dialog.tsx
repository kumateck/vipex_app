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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { SenderCashierParcel } from '../../api/parcel.api';
import { PAYMENT_METHOD_OPTIONS } from './constants';
import { formatCurrency, getSenderDuePsw } from './utils';

type CollectSenderPaymentDialogProps = {
  parcel: SenderCashierParcel | null;
  pickupLocationName: string;
  amount: string;
  onAmountChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function CollectSenderPaymentDialog({
  parcel,
  pickupLocationName,
  amount,
  onAmountChange,
  paymentMethod,
  onPaymentMethodChange,
  isSubmitting,
  onClose,
  onSubmit,
}: CollectSenderPaymentDialogProps) {
  return (
    <Dialog open={Boolean(parcel)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect Sender Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tracking</p>
            <p className="font-medium">{parcel?.trackingCode ?? '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Destination</p>
            <div className="leading-tight">
              <p className="font-medium">
                {parcel?.destinationName ?? parcel?.destinationId ?? '-'}
              </p>
              <p className="text-muted-foreground text-xs">
                {pickupLocationName || parcel?.pickupLocationName || '-'}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Expected Charge</p>
            <p className="font-medium">{parcel ? formatCurrency(parcel.chargePsw) : '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Sender Should Pay</p>
            <p className="font-medium">{parcel ? formatCurrency(getSenderDuePsw(parcel)) : '-'}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-payment-amount">Amount (GHS)</Label>
            <Input
              id="sender-payment-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0.00"
              disabled={parcel ? getSenderDuePsw(parcel) <= 0 : false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger
                id="sender-payment-method"
                disabled={parcel ? getSenderDuePsw(parcel) <= 0 : false}
              >
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
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={isSubmitting}>
            {isSubmitting
              ? 'Processing...'
              : parcel && getSenderDuePsw(parcel) > 0
                ? 'Collect Payment'
                : 'Print Receipts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
