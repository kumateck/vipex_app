import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { formatCurrency, formatDateTime, formatStorageCharge } from './receiver-cashier-utils';
import type { useParcelReceiverCashierWorkflow } from './use-parcel-receiver-cashier-workflow';

type WorkflowContext = ReturnType<typeof useParcelReceiverCashierWorkflow>['context'];
type WorkflowDialog = ReturnType<typeof useParcelReceiverCashierWorkflow>['dialog'];
type SelectedParcel = NonNullable<WorkflowDialog['selectedParcel']>;

export function ReceiverPaymentPrimarySections({
  context,
  dialog,
  parcel,
}: {
  context: WorkflowContext;
  dialog: WorkflowDialog;
  parcel: SelectedParcel;
}) {
  return (
    <>
      <StorageChargeSummary dialog={dialog} parcel={parcel} />
      <ParcelSummary dialog={dialog} parcel={parcel} />
      <PaymentInputs dialog={dialog} parcel={parcel} />
      <StorageWaiver context={context} dialog={dialog} />
      <PickerAndMomo context={context} dialog={dialog} parcel={parcel} />
    </>
  );
}

function StorageChargeSummary({
  dialog,
  parcel,
}: {
  dialog: WorkflowDialog;
  parcel: SelectedParcel;
}) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Storage Charge Summary</p>
        <Badge variant={parcel.isParcelAged ? 'destructive' : 'outline'}>
          {parcel.isParcelAged ? 'Aged Parcel' : 'Not Aged'}
        </Badge>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <p>
          <strong>Received At:</strong> {formatDateTime(parcel.receivedAt)}
        </p>
        <p>
          <strong>Age:</strong> {parcel.ageingDays != null ? `${parcel.ageingDays} days` : '-'}
        </p>
        <p>
          <strong>Storage Starts:</strong> {formatDateTime(parcel.storageChargeStartAt)}
        </p>
        <p>
          <strong>Grace Period:</strong> {parcel.storageChargeGraceDays ?? 14} days
        </p>
        <p>
          <strong>Rate:</strong> {formatCurrency(parcel.storageFeePerDayPsw ?? 200)} / day
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
  );
}

function ParcelSummary({ dialog, parcel }: { dialog: WorkflowDialog; parcel: SelectedParcel }) {
  return (
    <div className="grid gap-2 text-sm">
      <p>
        <strong>Booking:</strong> {parcel.bookingCode}
      </p>
      <p>
        <strong>Receiver:</strong> {parcel.receiverName ?? '-'} ({parcel.receiverPhone ?? '-'})
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
  );
}

function PaymentInputs({ dialog, parcel }: { dialog: WorkflowDialog; parcel: SelectedParcel }) {
  return (
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
        Base receiver due: {formatCurrency(dialog.receiverDuePsw)}. Suggested total with storage
        info: {formatCurrency(dialog.receiverDuePsw + (parcel.storageChargePsw ?? 0))}.
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
  );
}

function StorageWaiver({ context, dialog }: { context: WorkflowContext; dialog: WorkflowDialog }) {
  if (dialog.storageOutstandingPsw <= 0 || !context.canWaiveStorageAccrual) return null;
  return (
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
                error instanceof Error ? error.message : 'Failed to waive storage accrual',
              );
            }
          }}
          disabled={dialog.isSaving}
        >
          Waive Storage
        </Button>
      </div>
    </div>
  );
}

function PickerAndMomo({
  context,
  dialog,
  parcel,
}: {
  context: WorkflowContext;
  dialog: WorkflowDialog;
  parcel: SelectedParcel;
}) {
  return (
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
      <p className="text-xs text-muted-foreground">
        {context.cashierLocationName
          ? `Only active staff assigned to ${context.cashierLocationName} are shown.`
          : 'Your user account needs an assigned location before staff can be selected.'}
      </p>
      {dialog.paymentMethod === String(PaymentMethod.MTN) ? (
        <MomoRequestToPayPanel
          parcelId={parcel.id}
          flow="receiver"
          amountCedis={Number(dialog.paymentAmount || 0) + Number(dialog.storagePaymentAmount || 0)}
          onConfirmed={dialog.setMomoTransactionId}
          disabled={dialog.isSaving}
        />
      ) : null}
    </div>
  );
}
