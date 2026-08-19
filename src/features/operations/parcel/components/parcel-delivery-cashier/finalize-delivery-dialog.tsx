import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { PaymentMethod } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { formatMoney, formatPhones } from './utils';

type FinalizeDeliveryDialogProps = {
  parcel: ParcelSearchRow | null;
  deliveryAddress: string;
  assignedRiderLabel: string;
  deliveryAtLabel: string;
  configuredDeliveryFeePsw: number;
  toBePaidAmountPsw: number;
  outstanding: { principalPsw: number; deliveryFeePsw: number };
  hasToBePaidOutstanding: boolean;
  outstandingTotalPsw: number;
  principalAmount: string;
  onPrincipalAmountChange: (value: string) => void;
  deliveryFeeAmount: string;
  onDeliveryFeeAmountChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  isFinalizing: boolean;
  isFinalizeConfirmOpen: boolean;
  onFinalizeConfirmOpenChange: (open: boolean) => void;
  onClose: () => void;
  onFinalize: () => Promise<void>;
};

export function FinalizeDeliveryDialog({
  parcel,
  deliveryAddress,
  assignedRiderLabel,
  deliveryAtLabel,
  configuredDeliveryFeePsw,
  toBePaidAmountPsw,
  outstanding,
  hasToBePaidOutstanding,
  outstandingTotalPsw,
  principalAmount,
  onPrincipalAmountChange,
  deliveryFeeAmount,
  onDeliveryFeeAmountChange,
  paymentMethod,
  onPaymentMethodChange,
  isFinalizing,
  isFinalizeConfirmOpen,
  onFinalizeConfirmOpenChange,
  onClose,
  onFinalize,
}: FinalizeDeliveryDialogProps) {
  return (
    <Dialog
      open={Boolean(parcel)}
      onOpenChange={(open) => {
        if (open) return;
        onFinalizeConfirmOpenChange(false);
        onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalize Rider Return</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm">
            <strong>Receiver:</strong>
            <div className="mt-1 leading-tight">
              <div>{parcel?.receiverName ?? '-'}</div>
              <div className="text-xs text-muted-foreground">
                {formatPhones(parcel?.receiverPhone, parcel?.receiverPhone2)}
              </div>
            </div>
          </div>
          {parcel?.secondReceiverName ? (
            <div className="text-sm">
              <strong>Second Receiver:</strong>
              <div className="mt-1 leading-tight">
                <div>{parcel.secondReceiverName}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPhones(parcel.secondReceiverPhone, parcel.secondReceiverPhone2)}
                </div>
              </div>
            </div>
          ) : null}
          <p className="text-sm">
            <strong>Address:</strong> {deliveryAddress}
          </p>
          <p className="text-sm">
            <strong>Assigned Rider:</strong> {assignedRiderLabel}
          </p>
          <p className="text-sm">
            <strong>Delivery At:</strong> {deliveryAtLabel}
          </p>
          <p className="text-sm">
            <strong>Delivery Fee:</strong> {formatMoney(configuredDeliveryFeePsw)}
          </p>
          {toBePaidAmountPsw > 0 ? (
            <p className="text-sm">
              <strong>To Be Paid Amount:</strong> {formatMoney(toBePaidAmountPsw)}
            </p>
          ) : null}
          <p className="text-sm">
            <strong>Outstanding To Be Paid:</strong> {formatMoney(outstanding.principalPsw)}
          </p>
          <p className="text-sm">
            <strong>Outstanding Delivery Fee:</strong> {formatMoney(outstanding.deliveryFeePsw)}
          </p>
          {hasToBePaidOutstanding ? (
            <p className="text-sm">
              <strong>Total Outstanding:</strong> {formatMoney(outstandingTotalPsw)}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label>Principal Received (GHS)</Label>
            <Input
              inputMode="decimal"
              value={principalAmount}
              onChange={(event) => onPrincipalAmountChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Delivery Fee Received (GHS)</Label>
            <Input
              inputMode="decimal"
              value={deliveryFeeAmount}
              onChange={(event) => onDeliveryFeeAmountChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(PaymentMethod.CASH)}>Cash</SelectItem>
                <SelectItem value={String(PaymentMethod.MTN)}>MTN</SelectItem>
                <SelectItem value={String(PaymentMethod.TELECEL)}>Telecel</SelectItem>
                <SelectItem value={String(PaymentMethod.AIRTEL)}>Airtel</SelectItem>
                <SelectItem value={String(PaymentMethod.CREDIT)}>Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onFinalizeConfirmOpenChange(true)} disabled={isFinalizing}>
            {isFinalizing ? 'Finalizing...' : 'Confirm Delivered At Home'}
          </Button>
        </DialogFooter>
        <AlertDialog open={isFinalizeConfirmOpen} onOpenChange={onFinalizeConfirmOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalize delivery?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark {parcel?.bookingCode ?? 'this parcel'} as delivered at home with the
                entered payment values.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isFinalizing}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={isFinalizing} onClick={() => void onFinalize()}>
                {isFinalizing ? 'Finalizing...' : 'Finalize Delivery'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
