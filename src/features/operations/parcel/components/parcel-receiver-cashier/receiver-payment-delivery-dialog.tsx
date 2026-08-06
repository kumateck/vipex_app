import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { MomoRequestToPayPanel } from '@/features/operations/momo/components/momo-request-to-pay-panel';
import { PAYMENT_METHOD_OPTIONS } from './receiver-cashier-constants';
import { ReceiverOtpSection } from './receiver-otp-section';
import { ReceiverPaymentSecondarySections } from './receiver-payment-secondary-sections';
import { formatCurrency, formatDateTime, formatStorageCharge } from './receiver-cashier-utils';
import type { useParcelReceiverCashierWorkflow } from './use-parcel-receiver-cashier-workflow';

type WorkflowContext = ReturnType<typeof useParcelReceiverCashierWorkflow>['context'];
type WorkflowDialog = ReturnType<typeof useParcelReceiverCashierWorkflow>['dialog'];

type ReceiverPaymentDeliveryDialogProps = {
  context: WorkflowContext;
  dialog: WorkflowDialog;
};

export function ReceiverPaymentDeliveryDialog({
  context,
  dialog,
}: ReceiverPaymentDeliveryDialogProps) {
  const parcel = dialog.selectedParcel;

  return (
    <Dialog
      open={Boolean(parcel)}
      onOpenChange={(open) => (!open ? dialog.setSelectedParcel(null) : null)}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receiver Payment + Pickup Verification</DialogTitle>
        </DialogHeader>
        {!parcel ? null : (
          <div className="space-y-4">
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Storage Charge Summary</p>
                {parcel.isParcelAged ? (
                  <Badge variant="destructive">Aged Parcel</Badge>
                ) : (
                  <Badge variant="outline">Not Aged</Badge>
                )}
              </div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p>
                  <strong>Received At:</strong> {formatDateTime(parcel.receivedAt)}
                </p>
                <p>
                  <strong>Age:</strong>{' '}
                  {parcel.ageingDays != null ? `${parcel.ageingDays} days` : '-'}
                </p>
                <p>
                  <strong>Storage Starts:</strong> {formatDateTime(parcel.storageChargeStartAt)}
                </p>
                <p>
                  <strong>Grace Period:</strong> {parcel.storageChargeGraceDays ?? 14} days
                </p>
                <p>
                  <strong>Rate:</strong> {formatCurrency(parcel.storageFeePerDayPsw ?? 500)} / day
                </p>
                <p>
                  <strong>Accrued Days:</strong> {parcel.storageChargeDays ?? 0}
                </p>
                <p className="md:col-span-2">
                  <strong>Accrued Storage (Info):</strong> {formatStorageCharge(parcel)}
                </p>
                <p className="md:col-span-2">
                  <strong>Outstanding Storage (Settlement):</strong>{' '}
                  {formatCurrency(dialog.storageOutstandingPsw)}
                </p>
              </div>
            </div>

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
                <strong>Content:</strong> {parcel.parcelContent}
              </p>
              <p>
                <strong>Receiver Due:</strong> {formatCurrency(dialog.receiverDuePsw)}
              </p>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="receiver-payment-amount">Payment Amount (GHS)</Label>
              <Input
                id="receiver-payment-amount"
                inputMode="decimal"
                value={dialog.paymentAmount}
                onChange={(event) => dialog.setPaymentAmount(event.target.value)}
                placeholder="0.00"
                disabled={dialog.receiverDuePsw <= 0}
              />
              <p className="text-xs text-muted-foreground">
                Base receiver due: {formatCurrency(dialog.receiverDuePsw)}. Suggested total with
                storage info:{' '}
                {formatCurrency(dialog.receiverDuePsw + (parcel.storageChargePsw ?? 0))}.
              </p>

              <Label htmlFor="receiver-storage-amount">Storage Payment Amount (GHS)</Label>
              <Input
                id="receiver-storage-amount"
                inputMode="decimal"
                value={dialog.storagePaymentAmount}
                onChange={(event) => dialog.setStoragePaymentAmount(event.target.value)}
                placeholder="0.00"
                disabled={dialog.storageOutstandingPsw <= 0}
              />

              <Label htmlFor="receiver-payment-method">Payment Method</Label>
              <Select value={dialog.paymentMethod} onValueChange={dialog.setPaymentMethod}>
                <SelectTrigger
                  id="receiver-payment-method"
                  disabled={dialog.receiverDuePsw <= 0 && dialog.storageOutstandingPsw <= 0}
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

            {dialog.storageOutstandingPsw > 0 && context.canWaiveStorageAccrual ? (
              <div className="space-y-2 rounded-md border p-3">
                <Label>Waive Storage Accrual</Label>
                <Input
                  inputMode="decimal"
                  value={dialog.waiveStorageAmount}
                  onChange={(event) => dialog.setWaiveStorageAmount(event.target.value)}
                  placeholder="Waive amount (GHS)"
                />
                <Input
                  value={dialog.waiveStorageReason}
                  onChange={(event) => dialog.setWaiveStorageReason(event.target.value)}
                  placeholder="Waiver reason (required)"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await dialog.handleWaiveStorageAccrual();
                        toast.success('Storage accrual waived');
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : 'Failed to waive storage accrual',
                        );
                      }
                    }}
                    disabled={dialog.isSaving}
                  >
                    Waive Storage
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Shelf Picker Staff</Label>
              <Select value={dialog.pickerStaffId} onValueChange={dialog.setPickerStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {dialog.staffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {dialog.paymentMethod === String(PaymentMethod.MTN) ? (
                <MomoRequestToPayPanel
                  parcelId={parcel.id}
                  flow="receiver"
                  amountCedis={
                    Number(dialog.paymentAmount || 0) + Number(dialog.storagePaymentAmount || 0)
                  }
                  onConfirmed={dialog.setMomoTransactionId}
                  disabled={dialog.isSaving}
                />
              ) : null}
            </div>

            <ReceiverOtpSection dialog={dialog} />

            <div className="space-y-2 rounded-md border p-3">
              <Label>Main Receiver ID Card (optional)</Label>
              <Select
                value={dialog.mainCardMode}
                onValueChange={(value) => dialog.setMainCardMode(value as 'existing' | 'new')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing" disabled={dialog.mainReceiverCards.length === 0}>
                    Use existing card
                  </SelectItem>
                  <SelectItem value="new">Add new card</SelectItem>
                </SelectContent>
              </Select>
              {dialog.mainCardMode === 'existing' ? (
                <Select
                  value={dialog.mainExistingCardRecordId}
                  onValueChange={dialog.setMainExistingCardRecordId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing card" />
                  </SelectTrigger>
                  <SelectContent>
                    {dialog.mainReceiverCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.cardName} - {card.cardNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  <Select
                    value={dialog.mainNewCardTypeId}
                    onValueChange={dialog.setMainNewCardTypeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      {dialog.cardOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={dialog.mainNewCardNumber}
                    onChange={(event) => dialog.setMainNewCardNumber(event.target.value)}
                    placeholder="Card number"
                  />
                </div>
              )}
            </div>

            <ReceiverPaymentSecondarySections context={context} dialog={dialog} />
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => dialog.setSelectedParcel(null)}
            disabled={dialog.isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await dialog.handleConfirmDelivered();
                toast.success('Payment received and parcel marked as DELIVERED_BY_OFFICE');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to confirm delivery');
              }
            }}
            disabled={
              dialog.isSaving ||
              !dialog.otpVerified ||
              (dialog.paymentMethod === String(PaymentMethod.MTN) && !dialog.momoTransactionId) ||
              (context.isPickupQueueEnabled && !dialog.hasPickupQueue)
            }
          >
            {dialog.isSaving ? 'Processing...' : 'Receive Payment + Deliver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
