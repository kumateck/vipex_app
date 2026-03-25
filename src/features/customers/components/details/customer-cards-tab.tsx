import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CardImageViewDialog } from '@/features/uploads/components/card-image-view-dialog';
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
  isUpdatingCard: boolean;
  onAddCard: () => Promise<void>;
  onUpdateCard: (input: {
    cardRecordId: string;
    cardId: string;
    cardNumber: string;
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
  }) => Promise<void>;
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
  isUpdatingCard,
  onAddCard,
  onUpdateCard,
}: CustomerCardsTabProps) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardId, setEditCardId] = useState('');
  const [editCardNumber, setEditCardNumber] = useState('');
  const [editFrontImageUrl, setEditFrontImageUrl] = useState<string | null>(null);
  const [editBackImageUrl, setEditBackImageUrl] = useState<string | null>(null);

  const startEdit = (item: CustomerCardRecord) => {
    setEditingCardId(item.id);
    setEditCardId(item.cardId);
    setEditCardNumber(item.cardNumber);
    setEditFrontImageUrl(item.frontImageUrl ?? null);
    setEditBackImageUrl(item.backImageUrl ?? null);
  };

  const cancelEdit = () => {
    setEditingCardId(null);
    setEditCardId('');
    setEditCardNumber('');
    setEditFrontImageUrl(null);
    setEditBackImageUrl(null);
  };

  const saveEdit = async () => {
    if (!editingCardId) return;
    await onUpdateCard({
      cardRecordId: editingCardId,
      cardId: editCardId,
      cardNumber: editCardNumber,
      frontImageUrl: editFrontImageUrl,
      backImageUrl: editBackImageUrl,
    });
    cancelEdit();
  };

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
                {editingCardId === item.id ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <Select value={editCardId} onValueChange={setEditCardId}>
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
                        value={editCardNumber}
                        onChange={(event) => setEditCardNumber(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ImageUploadField
                        id={`customer-card-front-image-${item.id}`}
                        label="Card front image"
                        value={editFrontImageUrl}
                        onChange={setEditFrontImageUrl}
                        helperText="Optional front image of the customer card."
                        disabled={isUpdatingCard}
                      />
                      <ImageUploadField
                        id={`customer-card-back-image-${item.id}`}
                        label="Card back image"
                        value={editBackImageUrl}
                        onChange={setEditBackImageUrl}
                        helperText="Optional back image of the customer card."
                        disabled={isUpdatingCard}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void saveEdit()}
                        disabled={isUpdatingCard}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={isUpdatingCard}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium">{item.cardName}</p>
                    <p className="text-muted-foreground">{item.cardNumber}</p>
                    <div className="mt-2 flex gap-2">
                      <CardImageViewDialog
                        frontImageUrl={item.frontImageUrl}
                        backImageUrl={item.backImageUrl}
                        title={`${item.cardName} Images`}
                        description={`Card number: ${item.cardNumber}`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
