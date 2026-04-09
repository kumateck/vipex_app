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
import type { ParcelFullDetails, ParcelSearchRow } from '../../api/parcel.api';
import { PickupVerificationHandoverSection } from './pickup-verification-handover-section';
type StaffOption = {
  id: string;
  fullname: string;
};
type CardOption = {
  id: string;
  name: string;
};
type CustomerCard = {
  id: string;
  cardName: string;
  cardNumber: string;
};
type PickupVerificationDialogProps = {
  open: boolean;
  parcel: ParcelSearchRow | null;
  onClose: () => void;
  pickerStaffId: string;
  onPickerStaffIdChange: (value: string) => void;
  staffOptions: StaffOption[];
  isPickupQueueEnabled: boolean;
  hasPickupQueue: boolean;
  parcelDetails: ParcelFullDetails | undefined;
  formatDateTime: (value: string | null | undefined) => string;
  mainCardMode: string;
  onMainCardModeChange: (value: string) => void;
  mainExistingCardRecordId: string;
  onMainExistingCardRecordIdChange: (value: string) => void;
  mainNewCardTypeId: string;
  onMainNewCardTypeIdChange: (value: string) => void;
  mainNewCardNumber: string;
  onMainNewCardNumberChange: (value: string) => void;
  mainReceiverCards: CustomerCard[];
  handoverTarget: string;
  onHandoverTargetChange: (value: string) => void;
  secondNewName: string;
  onSecondNewNameChange: (value: string) => void;
  secondNewPhone: string;
  onSecondNewPhoneChange: (value: string) => void;
  secondCardMode: string;
  onSecondCardModeChange: (value: string) => void;
  secondExistingCardRecordId: string;
  onSecondExistingCardRecordIdChange: (value: string) => void;
  secondNewCardTypeId: string;
  onSecondNewCardTypeIdChange: (value: string) => void;
  secondNewCardNumber: string;
  onSecondNewCardNumberChange: (value: string) => void;
  secondReceiverCards: CustomerCard[];
  cardOptions: CardOption[];
  isSaving: boolean;
  onRequestHomeDelivery: () => Promise<void>;
  onConfirmDelivered: () => Promise<void>;
};
export function PickupVerificationDialog({
  open,
  parcel,
  onClose,
  pickerStaffId,
  onPickerStaffIdChange,
  staffOptions,
  isPickupQueueEnabled,
  hasPickupQueue,
  parcelDetails,
  formatDateTime,
  mainCardMode,
  onMainCardModeChange,
  mainExistingCardRecordId,
  onMainExistingCardRecordIdChange,
  mainNewCardTypeId,
  onMainNewCardTypeIdChange,
  mainNewCardNumber,
  onMainNewCardNumberChange,
  mainReceiverCards,
  handoverTarget,
  onHandoverTargetChange,
  secondNewName,
  onSecondNewNameChange,
  secondNewPhone,
  onSecondNewPhoneChange,
  secondCardMode,
  onSecondCardModeChange,
  secondExistingCardRecordId,
  onSecondExistingCardRecordIdChange,
  secondNewCardTypeId,
  onSecondNewCardTypeIdChange,
  secondNewCardNumber,
  onSecondNewCardNumberChange,
  secondReceiverCards,
  cardOptions,
  isSaving,
  onRequestHomeDelivery,
  onConfirmDelivered,
}: PickupVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pickup Verification</DialogTitle>
        </DialogHeader>
        {!parcel ? null : (
          <div className="space-y-4">
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
            </div>
            <div className="space-y-2">
              <Label>Shelf Picker Staff</Label>
              <Select value={pickerStaffId} onValueChange={onPickerStaffIdChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isPickupQueueEnabled ? (
              <div className="space-y-3 rounded-md border p-3">
                <div>
                  <Label>Pickup Queue</Label>
                  <p className="text-sm text-muted-foreground">
                    Queue tickets are created from the Pickup Queue page before final handover.
                  </p>
                </div>
                {hasPickupQueue ? (
                  <div className="rounded-md bg-muted/40 p-3 text-sm">
                    <p>
                      <strong>Queue Code:</strong> {parcelDetails?.pickupQueue?.queueCode}
                    </p>
                    <p>
                      <strong>Queue Number:</strong> {parcelDetails?.pickupQueue?.queueNumber}
                    </p>
                    <p>
                      <strong>Queued At:</strong>{' '}
                      {formatDateTime(parcelDetails?.pickupQueue?.queuedAt ?? null)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    No queue ticket found yet. Create it from the shared Pickup Queue page, then
                    return here to complete handover.
                  </div>
                )}
              </div>
            ) : null}
            <div className="space-y-2 rounded-md border p-3">
              <Label>Main Receiver ID Card (required)</Label>
              <Select value={mainCardMode} onValueChange={onMainCardModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing" disabled={mainReceiverCards.length === 0}>
                    Use existing card
                  </SelectItem>
                  <SelectItem value="new">Add new card</SelectItem>
                </SelectContent>
              </Select>
              {mainCardMode === 'existing' ? (
                <Select
                  value={mainExistingCardRecordId}
                  onValueChange={onMainExistingCardRecordIdChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing card" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainReceiverCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.cardName} - {card.cardNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  <Select value={mainNewCardTypeId} onValueChange={onMainNewCardTypeIdChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cardOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={mainNewCardNumber}
                    onChange={(event) => onMainNewCardNumberChange(event.target.value)}
                    placeholder="Card number"
                  />
                </div>
              )}
            </div>
            <PickupVerificationHandoverSection
              parcelSecondReceiverId={parcel.secondReceiverId}
              handoverTarget={handoverTarget}
              onHandoverTargetChange={onHandoverTargetChange}
              secondNewName={secondNewName}
              onSecondNewNameChange={onSecondNewNameChange}
              secondNewPhone={secondNewPhone}
              onSecondNewPhoneChange={onSecondNewPhoneChange}
              secondCardMode={secondCardMode}
              onSecondCardModeChange={onSecondCardModeChange}
              secondExistingCardRecordId={secondExistingCardRecordId}
              onSecondExistingCardRecordIdChange={onSecondExistingCardRecordIdChange}
              secondNewCardTypeId={secondNewCardTypeId}
              onSecondNewCardTypeIdChange={onSecondNewCardTypeIdChange}
              secondNewCardNumber={secondNewCardNumber}
              onSecondNewCardNumberChange={onSecondNewCardNumberChange}
              secondReceiverCards={secondReceiverCards}
              cardOptions={cardOptions}
            />
            {parcelDetails ? (
              <div className="rounded-md border p-3 text-sm">
                <p>
                  <strong>Payments:</strong> {parcelDetails.payments.length}
                </p>
                <p>
                  <strong>Consignments:</strong> {parcelDetails.consignments.length}
                </p>
              </div>
            ) : null}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await onRequestHomeDelivery();
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : 'Failed to move parcel to home delivery',
                );
              }
            }}
            disabled={isSaving}
          >
            Request Home Delivery
          </Button>
          <Button
            onClick={async () => {
              try {
                await onConfirmDelivered();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to confirm delivery');
              }
            }}
            disabled={isSaving || (isPickupQueueEnabled && !hasPickupQueue)}
          >
            Confirm Delivered
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
