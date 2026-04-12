import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

type CardOption = {
  id: string;
  name: string;
};

type CustomerCard = {
  id: string;
  cardName: string;
  cardNumber: string;
};

type PickupVerificationHandoverSectionProps = {
  parcelSecondReceiverId: string | null;
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
};

export function PickupVerificationHandoverSection({
  parcelSecondReceiverId,
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
}: PickupVerificationHandoverSectionProps) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label>Who Collected Parcel</Label>
      <Select value={handoverTarget} onValueChange={onHandoverTargetChange}>
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
          {!parcelSecondReceiverId ? (
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={secondNewName}
                onChange={(event) => onSecondNewNameChange(event.target.value)}
                placeholder="Second receiver full name"
              />
              <Input
                value={secondNewPhone}
                onChange={(event) => onSecondNewPhoneChange(event.target.value)}
                placeholder="Second receiver telephone"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Using linked second receiver for this parcel.
            </p>
          )}

          <Select value={secondCardMode} onValueChange={onSecondCardModeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              <Select value={secondNewCardTypeId} onValueChange={onSecondNewCardTypeIdChange}>
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
          )}
        </div>
      ) : null}
    </div>
  );
}
