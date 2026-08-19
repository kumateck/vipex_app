import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

type CustomerCard = { id: string; cardName: string; cardNumber: string };
type CardOption = { id: string; name: string };

type PickupMainCardSectionProps = {
  mode: string;
  onModeChange: (value: string) => void;
  existingCardRecordId: string;
  onExistingCardRecordIdChange: (value: string) => void;
  newCardTypeId: string;
  onNewCardTypeIdChange: (value: string) => void;
  newCardNumber: string;
  onNewCardNumberChange: (value: string) => void;
  receiverCards: CustomerCard[];
  cardOptions: CardOption[];
};

export function PickupMainCardSection({
  mode,
  onModeChange,
  existingCardRecordId,
  onExistingCardRecordIdChange,
  newCardTypeId,
  onNewCardTypeIdChange,
  newCardNumber,
  onNewCardNumberChange,
  receiverCards,
  cardOptions,
}: PickupMainCardSectionProps) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label>Main Receiver ID Card (optional)</Label>
      <Select value={mode} onValueChange={onModeChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No card</SelectItem>
          <SelectItem value="existing" disabled={receiverCards.length === 0}>
            Use existing card
          </SelectItem>
          <SelectItem value="new">Add new card</SelectItem>
        </SelectContent>
      </Select>
      {mode === 'existing' ? (
        <Select value={existingCardRecordId} onValueChange={onExistingCardRecordIdChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select existing card" />
          </SelectTrigger>
          <SelectContent>
            {receiverCards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.cardName} - {card.cardNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : mode === 'new' ? (
        <div className="grid gap-2 md:grid-cols-2">
          <Select value={newCardTypeId} onValueChange={onNewCardTypeIdChange}>
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
            value={newCardNumber}
            onChange={(event) => onNewCardNumberChange(event.target.value)}
            placeholder="Card number"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No ID card will be recorded for this pickup.
        </p>
      )}
    </div>
  );
}
