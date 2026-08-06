import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PHONE_DIGITS, limitPhoneDigits } from '@/lib/phone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { formatCurrency, formatDateTime } from './receiver-cashier-utils';
import type { useParcelReceiverCashierWorkflow } from './use-parcel-receiver-cashier-workflow';

type WorkflowContext = ReturnType<typeof useParcelReceiverCashierWorkflow>['context'];
type WorkflowDialog = ReturnType<typeof useParcelReceiverCashierWorkflow>['dialog'];

type ReceiverPaymentSecondarySectionsProps = {
  context: WorkflowContext;
  dialog: WorkflowDialog;
};

export function ReceiverPaymentSecondarySections({
  context,
  dialog,
}: ReceiverPaymentSecondarySectionsProps) {
  const parcel = dialog.selectedParcel;
  if (!parcel) return null;

  return (
    <>
      {dialog.storageOutstandingPsw > 0 && dialog.parcelDetails?.storageWaivers?.length ? (
        <div className="space-y-2 rounded-md border p-3">
          <Label>Storage Waiver History</Label>
          <div className="space-y-1">
            {dialog.parcelDetails.storageWaivers.map((waiver) => (
              <div key={waiver.id} className="rounded border p-2 text-xs">
                <p className="font-medium">{formatCurrency(waiver.waivedAmountPsw)} waived</p>
                <p className="text-muted-foreground">
                  {waiver.waivedByName ?? '-'} • {formatDateTime(waiver.waivedAt)}
                </p>
                <p className="text-muted-foreground">
                  Accounting:{' '}
                  {waiver.accountingJournalEntryId
                    ? `Posted (${waiver.accountingJournalEntryId})`
                    : 'Not posted'}
                </p>
                <p>{waiver.reason}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {context.isPickupQueueEnabled ? (
        <div className="space-y-3 rounded-md border p-3">
          <div>
            <Label>Pickup Queue</Label>
            <p className="text-sm text-muted-foreground">
              Queue tickets are created from the Pickup Queue page before payment and handover.
            </p>
          </div>

          {dialog.hasPickupQueue ? (
            <div className="rounded-md bg-muted/40 p-3 text-sm">
              <p>
                <strong>Queue Code:</strong> {dialog.parcelDetails?.pickupQueue?.queueCode}
              </p>
              <p>
                <strong>Queue Number:</strong> {dialog.parcelDetails?.pickupQueue?.queueNumber}
              </p>
              <p>
                <strong>Queued At:</strong>{' '}
                {formatDateTime(dialog.parcelDetails?.pickupQueue?.queuedAt)}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              No queue ticket found yet. Create it from the shared Pickup Queue page, then return
              here to collect payment and hand over the parcel.
            </div>
          )}
        </div>
      ) : null}

      <div className="space-y-2 rounded-md border p-3">
        <Label>Who Collected Parcel</Label>
        <Select
          value={dialog.handoverTarget}
          onValueChange={(value) => dialog.setHandoverTarget(value as 'main' | 'second')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">Main Receiver</SelectItem>
            <SelectItem value="second">Second Receiver</SelectItem>
          </SelectContent>
        </Select>

        {dialog.handoverTarget === 'second' ? (
          <div className="space-y-3">
            {!parcel.secondReceiverId ? (
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={dialog.secondNewName}
                  onChange={(event) => dialog.setSecondNewName(event.target.value)}
                  placeholder="Second receiver full name"
                />
                <Input
                  value={dialog.secondNewPhone}
                  onChange={(event) =>
                    dialog.setSecondNewPhone(limitPhoneDigits(event.target.value))
                  }
                  placeholder="Second receiver telephone"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={PHONE_DIGITS}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Using linked second receiver for this parcel.
              </p>
            )}

            <Select
              value={dialog.secondCardMode}
              onValueChange={(value) => dialog.setSecondCardMode(value as 'existing' | 'new')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing" disabled={dialog.secondReceiverCards.length === 0}>
                  Use existing card
                </SelectItem>
                <SelectItem value="new">Add new card</SelectItem>
              </SelectContent>
            </Select>

            {dialog.secondCardMode === 'existing' ? (
              <Select
                value={dialog.secondExistingCardRecordId}
                onValueChange={dialog.setSecondExistingCardRecordId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select second receiver card" />
                </SelectTrigger>
                <SelectContent>
                  {dialog.secondReceiverCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.cardName} - {card.cardNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                <Select
                  value={dialog.secondNewCardTypeId}
                  onValueChange={dialog.setSecondNewCardTypeId}
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
                  value={dialog.secondNewCardNumber}
                  onChange={(event) => dialog.setSecondNewCardNumber(event.target.value)}
                  placeholder="Second receiver card number"
                />
              </div>
            )}
          </div>
        ) : null}
      </div>

      {dialog.parcelDetails ? (
        <div className="rounded-md border p-3 text-sm">
          <p>
            <strong>Payments:</strong> {dialog.parcelDetails.payments.length}
          </p>
          <p>
            <strong>Consignments:</strong> {dialog.parcelDetails.consignments.length}
          </p>
        </div>
      ) : null}
    </>
  );
}
