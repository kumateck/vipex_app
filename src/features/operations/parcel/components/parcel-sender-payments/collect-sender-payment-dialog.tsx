import { useMemo } from 'react';
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
import { MomoRequestToPayPanel } from '@/features/operations/momo/components/momo-request-to-pay-panel';
import type { SenderCashierParcel } from '../../api/parcel.api';
import { ParcelSenderPaymentSummary } from '../parcel-sender-payment-summary';
import { PAYMENT_METHOD_OPTIONS } from './constants';
import { isMtnPayment, type MtnPaymentFlow } from './sender-payment-method';
import { getSenderDuePsw } from './utils';

type CollectSenderPaymentDialogProps = {
  parcel: SenderCashierParcel | null;
  pickupLocationName: string;
  amount: string;
  onAmountChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  mtnPaymentFlow: MtnPaymentFlow;
  onMtnPaymentFlowChange: (value: MtnPaymentFlow) => void;
  momoTransactionId: string;
  onMomoConfirmed: (momoTransactionId: string) => void;
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
  mtnPaymentFlow,
  onMtnPaymentFlowChange,
  momoTransactionId,
  onMomoConfirmed,
  isSubmitting,
  onClose,
  onSubmit,
}: CollectSenderPaymentDialogProps) {
  const senderDuePsw = parcel ? getSenderDuePsw(parcel) : 0;
  const summaryItems = useMemo(
    () =>
      parcel
        ? [
            {
              parcelId: parcel.id,
              bookingCode: parcel.bookingCode,
              destinationBranchName: parcel.destinationName ?? parcel.destinationId,
              destinationLocationName: pickupLocationName || parcel.pickupLocationName,
              parcelDetails: parcel.parcelDetails,
              parcelContent: parcel.parcelContent,
              parcelValueCedis: Number(parcel.parcelValuePsw ?? 0) / 100,
              expectedChargeCedis: parcel.chargePsw / 100,
              senderShouldPayCedis: senderDuePsw / 100,
              senderName: parcel.senderName,
              senderPhone: parcel.senderPhone,
              senderPhone2: parcel.senderPhone2,
              receiverName: parcel.receiverName,
              receiverPhone: parcel.receiverPhone,
              receiverPhone2: parcel.receiverPhone2,
            },
          ]
        : [],
    [parcel, pickupLocationName, senderDuePsw],
  );

  return (
    <Dialog open={Boolean(parcel)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect Sender Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ParcelSenderPaymentSummary items={summaryItems} />

          <div className="space-y-2">
            <Label htmlFor="sender-payment-amount">Amount (GHS)</Label>
            <Input
              id="sender-payment-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0.00"
              disabled={parcel ? senderDuePsw <= 0 : false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger
                id="sender-payment-method"
                disabled={parcel ? senderDuePsw <= 0 : false}
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

          {parcel && senderDuePsw > 0 && isMtnPayment(paymentMethod) ? (
            <div className="space-y-2">
              <Label htmlFor="sender-mtn-payment-flow">MTN payment flow</Label>
              <Select
                value={mtnPaymentFlow}
                onValueChange={(value) => onMtnPaymentFlowChange(value as MtnPaymentFlow)}
              >
                <SelectTrigger id="sender-mtn-payment-flow">
                  <SelectValue placeholder="Select MTN payment flow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automated">Automated Request-to-Pay</SelectItem>
                  <SelectItem value="manual">Manual — customer already sent payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {parcel &&
          senderDuePsw > 0 &&
          isMtnPayment(paymentMethod) &&
          mtnPaymentFlow === 'automated' ? (
            <MomoRequestToPayPanel
              parcelId={parcel.id}
              flow="sender"
              amountCedis={senderDuePsw / 100}
              onConfirmed={onMomoConfirmed}
              disabled={isSubmitting}
            />
          ) : null}

          {parcel &&
          senderDuePsw > 0 &&
          isMtnPayment(paymentMethod) &&
          mtnPaymentFlow === 'manual' ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
              Confirm that the customer has already sent the payment to the company MTN MoMo number.
              No payment request will be initiated.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={
              isSubmitting ||
              (senderDuePsw > 0 &&
                isMtnPayment(paymentMethod) &&
                mtnPaymentFlow === 'automated' &&
                !momoTransactionId)
            }
          >
            {isSubmitting
              ? 'Processing...'
              : parcel && senderDuePsw > 0
                ? 'Collect Payment'
                : 'Print Receipts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
