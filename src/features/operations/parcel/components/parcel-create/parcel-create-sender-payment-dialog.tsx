import { useMemo } from 'react';
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
import { PaymentMethod } from '@/db/schemas/enums';
import { MomoRequestToPayPanel } from '@/features/operations/momo/components/momo-request-to-pay-panel';
import { ParcelSenderPaymentSummary } from '../parcel-sender-payment-summary';
import { PAYMENT_METHOD_OPTIONS } from '../parcel-sender-payments/constants';
import type { PendingSenderPaymentParcel } from './parcel-form.types';

type ParcelCreateSenderPaymentDialogProps = {
  parcels: PendingSenderPaymentParcel[];
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  momoTransactionId: string;
  onMomoConfirmed: (momoTransactionId: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function ParcelCreateSenderPaymentDialog({
  parcels,
  paymentMethod,
  onPaymentMethodChange,
  momoTransactionId,
  onMomoConfirmed,
  isSubmitting,
  onClose,
  onSubmit,
}: ParcelCreateSenderPaymentDialogProps) {
  const totalDue = parcels.reduce((total, parcel) => total + parcel.senderDueCedis, 0);
  const summaryItems = useMemo(
    () =>
      parcels.map((parcel) => ({
        parcelId: parcel.parcelId,
        bookingCode: parcel.bookingCode,
        destinationBranchName: parcel.destinationBranchName,
        destinationLocationName: parcel.destinationLocationName,
        parcelDetails: parcel.parcelDetails,
        parcelContent: parcel.parcelContent,
        parcelValueCedis: parcel.parcelValueCedis,
        expectedChargeCedis: parcel.totalChargeCedis,
        senderShouldPayCedis: parcel.senderDueCedis,
        senderName: parcel.senderName,
        senderPhone: parcel.senderTelephone,
        senderPhone2: parcel.senderTelephone2,
        receiverName: parcel.receiverName,
        receiverPhone: parcel.receiverTelephone,
        receiverPhone2: parcel.receiverTelephone2,
      })),
    [parcels],
  );

  return (
    <Dialog open={parcels.length > 0} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect Sender Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ParcelSenderPaymentSummary items={summaryItems} />

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

          {paymentMethod === String(PaymentMethod.MTN) && parcels[0] ? (
            <MomoRequestToPayPanel
              parcelId={parcels[0].parcelId}
              flow="sender"
              amountCedis={totalDue}
              onConfirmed={onMomoConfirmed}
              disabled={isSubmitting}
            />
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Print Later
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={
              isSubmitting || (paymentMethod === String(PaymentMethod.MTN) && !momoTransactionId)
            }
          >
            {isSubmitting ? 'Processing...' : 'Pay and Print'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
