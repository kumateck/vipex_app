import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ImageUploadField } from '@/features/uploads/components/image-upload-field';
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
  frontImageUrl?: string | null;
  onFrontImageUrlChange: (value: string | null) => void;
  backImageUrl?: string | null;
  onBackImageUrlChange: (value: string | null) => void;
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
  frontImageUrl,
  onFrontImageUrlChange,
  backImageUrl,
  onBackImageUrlChange,
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

        <div className="grid gap-3 md:grid-cols-2">
          <ImageUploadField
            id="customer-card-front-image"
            label="Card front image"
            value={frontImageUrl}
            onChange={onFrontImageUrlChange}
            helperText="Optional front image of the customer card."
            disabled={isAddingCard}
          />
          <ImageUploadField
            id="customer-card-back-image"
            label="Card back image"
            value={backImageUrl}
            onChange={onBackImageUrlChange}
            helperText="Optional back image of the customer card."
            disabled={isAddingCard}
          />
        </div>

        <div className="space-y-1">
          {customerCards.length === 0 ? (
            <p className="text-xs text-muted-foreground">No cards linked yet.</p>
          ) : (
            customerCards.map((item) => (
              <div key={item.id} className="rounded-md border p-2 text-xs">
                <p className="font-medium">{item.cardName}</p>
                <p className="text-muted-foreground">{item.cardNumber}</p>
                <div className="mt-2 flex gap-2">
                  {item.frontImageUrl ? (
                    <a
                      href={item.frontImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Front image
                    </a>
                  ) : null}
                  {item.backImageUrl ? (
                    <a
                      href={item.backImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Back image
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
