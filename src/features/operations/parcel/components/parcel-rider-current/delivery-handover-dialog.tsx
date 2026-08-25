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
import { ReactSignature } from '@/components/ui/react-signature';
import { PHONE_DIGITS, limitPhoneDigits } from '@/lib/phone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { RiderDoorstepRecord } from '../../api/parcel.api';
import type { CardMode, HandoverTarget } from './types';

type DeliveryHandoverDialogProps = {
  selected: RiderDoorstepRecord | null;
  onSignatureImageChange: (value: string | undefined) => void;
  handoverTarget: HandoverTarget;
  onHandoverTargetChange: (value: HandoverTarget) => void;
  mainCardMode: CardMode;
  onMainCardModeChange: (value: CardMode) => void;
  mainExistingCardRecordId: string;
  onMainExistingCardRecordIdChange: (value: string) => void;
  mainNewCardTypeId: string;
  onMainNewCardTypeIdChange: (value: string) => void;
  mainNewCardNumber: string;
  onMainNewCardNumberChange: (value: string) => void;
  secondCardMode: CardMode;
  onSecondCardModeChange: (value: CardMode) => void;
  secondExistingCardRecordId: string;
  onSecondExistingCardRecordIdChange: (value: string) => void;
  secondNewCardTypeId: string;
  onSecondNewCardTypeIdChange: (value: string) => void;
  secondNewCardNumber: string;
  onSecondNewCardNumberChange: (value: string) => void;
  secondNewName: string;
  onSecondNewNameChange: (value: string) => void;
  secondNewPhone: string;
  onSecondNewPhoneChange: (value: string) => void;
  cardOptions: Array<{ id: string; name: string }>;
  mainReceiverCards: Array<{ id: string; cardName?: string | null; cardNumber: string }>;
  secondReceiverCards: Array<{ id: string; cardName?: string | null; cardNumber: string }>;
  isConfirming: boolean;
  isUploadingSignature: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};
export function DeliveryHandoverDialog({
  selected,
  onSignatureImageChange,
  handoverTarget,
  onHandoverTargetChange,
  mainCardMode,
  onMainCardModeChange,
  mainExistingCardRecordId,
  onMainExistingCardRecordIdChange,
  mainNewCardTypeId,
  onMainNewCardTypeIdChange,
  mainNewCardNumber,
  onMainNewCardNumberChange,
  secondCardMode,
  onSecondCardModeChange,
  secondExistingCardRecordId,
  onSecondExistingCardRecordIdChange,
  secondNewCardTypeId,
  onSecondNewCardTypeIdChange,
  secondNewCardNumber,
  onSecondNewCardNumberChange,
  secondNewName,
  onSecondNewNameChange,
  secondNewPhone,
  onSecondNewPhoneChange,
  cardOptions,
  mainReceiverCards,
  secondReceiverCards,
  isConfirming,
  isUploadingSignature,
  onClose,
  onConfirm,
}: DeliveryHandoverDialogProps) {
  return (
    <Dialog open={Boolean(selected)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery Handover</DialogTitle>
        </DialogHeader>
        {!selected ? null : (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm">
              <p>
                <strong>Booking:</strong> {selected.bookingCode}
              </p>
              <p>
                <strong>Address:</strong> {selected.dropoffAddress ?? '-'}
              </p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold">
                Delivery Fee: GHS{' '}
                {((selected.outstandingDeliveryFeePsw ?? selected.deliveryFeePsw) / 100).toFixed(2)}
              </p>
              <p className="text-2xl font-bold">
                To Be Paid: GHS{' '}
                {((selected.outstandingPrincipalPsw ?? selected.plannedToBePaidPsw) / 100).toFixed(
                  2,
                )}
              </p>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <Label>Main Receiver ID Card (optional)</Label>
              <Select
                value={mainCardMode}
                onValueChange={(v) => onMainCardModeChange(v as CardMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No card</SelectItem>
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
              ) : mainCardMode === 'new' ? (
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  No ID card will be recorded for this handover.
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <Label>Who Received</Label>
              <Select
                value={handoverTarget}
                onValueChange={(v) => onHandoverTargetChange(v as HandoverTarget)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Receiver</SelectItem>
                  <SelectItem value="second">Second Receiver</SelectItem>
                </SelectContent>
              </Select>
              {handoverTarget === 'second' ? (
                <div className="space-y-3">
                  {!selected.secondReceiverId ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        value={secondNewName}
                        onChange={(event) => onSecondNewNameChange(event.target.value)}
                        placeholder="Second receiver full name"
                      />
                      <Input
                        value={secondNewPhone}
                        onChange={(event) =>
                          onSecondNewPhoneChange(limitPhoneDigits(event.target.value))
                        }
                        placeholder="Second receiver telephone"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={PHONE_DIGITS}
                      />
                    </div>
                  ) : null}
                  <Select
                    value={secondCardMode}
                    onValueChange={(v) => onSecondCardModeChange(v as CardMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No card</SelectItem>
                      <SelectItem value="existing" disabled={secondReceiverCards.length === 0}>
                        Use existing card
                      </SelectItem>
                      <SelectItem value="new">Add new card</SelectItem>
                    </SelectContent>
                  </Select>
                  {secondCardMode === 'existing' ? (
                    <Select
                      value={secondExistingCardRecordId}
                      onValueChange={onSecondExistingCardRecordIdChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select second receiver card" />
                      </SelectTrigger>
                      <SelectContent>
                        {secondReceiverCards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.cardName} - {card.cardNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : secondCardMode === 'new' ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      <Select
                        value={secondNewCardTypeId}
                        onValueChange={onSecondNewCardTypeIdChange}
                      >
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
                        value={secondNewCardNumber}
                        onChange={(event) => onSecondNewCardNumberChange(event.target.value)}
                        placeholder="Second receiver card number"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No ID card will be recorded for the second receiver.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Receiver Signature</Label>
              <ReactSignature onChange={onSignatureImageChange} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void onConfirm()} disabled={isConfirming || isUploadingSignature}>
            {isUploadingSignature
              ? 'Uploading Signature...'
              : isConfirming
                ? 'Saving...'
                : 'Confirm Handover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
