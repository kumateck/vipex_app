import { toast } from 'sonner';
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
import { ReceiverOtpSection } from './receiver-otp-section';
import { ReceiverPaymentSecondarySections } from './receiver-payment-secondary-sections';
import { ReceiverPaymentPrimarySections } from './receiver-payment-primary-sections';
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receiver Payment + Pickup Verification</DialogTitle>
        </DialogHeader>
        {!parcel ? null : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <ReceiverPaymentPrimarySections context={context} dialog={dialog} parcel={parcel} />
            </div>

            <div className="space-y-4">
              <div className="space-y-2 rounded-md border p-3">
                <Label>Main Receiver ID Card (optional)</Label>
                <Select
                  value={dialog.mainCardMode}
                  onValueChange={(value) =>
                    dialog.setMainCardMode(value as 'none' | 'existing' | 'new')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No card</SelectItem>
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
                ) : dialog.mainCardMode === 'new' ? (
                  <div className="grid gap-2">
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
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No ID card will be recorded for this handover.
                  </p>
                )}
              </div>

              <ReceiverPaymentSecondarySections context={context} dialog={dialog} />

              {context.isReceiverOtpRequired ? (
                <ReceiverOtpSection dialog={dialog} />
              ) : (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <p className="font-medium">Receiver OTP is disabled for this branch</p>
                  <p className="text-muted-foreground">
                    Continue without OTP only when processing an approved legacy record.
                  </p>
                </div>
              )}
            </div>
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
              (context.isReceiverOtpRequired && !dialog.otpVerified) ||
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
