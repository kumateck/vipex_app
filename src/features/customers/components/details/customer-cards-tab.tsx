import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CustomerCardOption, CustomerCardRecord } from '@/features/customers/api';

type CustomerCardsTabProps = {
  cardId: string;
  onCardIdChange: (value: string) => void;
  cardNumber: string;
  onCardNumberChange: (value: string) => void;
  cardOptions: CustomerCardOption[];
  customerCards: CustomerCardRecord[];
  isAddingCard: boolean;
  onAddCard: () => Promise<void>;
};

export function CustomerCardsTab({
  cardId,
  onCardIdChange,
  cardNumber,
  onCardNumberChange,
  cardOptions,
  customerCards,
  isAddingCard,
  onAddCard,
}: CustomerCardsTabProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Customer Cards</CardTitle>
        <CardDescription>Add and view cards for this customer.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Select value={cardId} onValueChange={onCardIdChange}>
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
            placeholder="Card number"
            value={cardNumber}
            onChange={(event) => onCardNumberChange(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void onAddCard()}
            disabled={isAddingCard}
          >
            Add Card
          </Button>
        </div>

        <div className="space-y-1">
          {customerCards.length === 0 ? (
            <p className="text-xs text-muted-foreground">No cards linked yet.</p>
          ) : (
            customerCards.map((item) => (
              <div key={item.id} className="rounded-md border p-2 text-xs">
                <p className="font-medium">{item.cardName}</p>
                <p className="text-muted-foreground">{item.cardNumber}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
