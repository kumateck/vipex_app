import type { CardMode, CustomerCardRecord } from './receiver-cashier-types';

type ResolveCustomerCardInput = {
  customerId: string;
  mode: CardMode;
  existingRecordId: string;
  existingCards: CustomerCardRecord[];
  newCardTypeId: string;
  newCardNumber: string;
  addCustomerCard: (args: {
    customerId: string;
    cardId: string;
    cardNumber: string;
  }) => Promise<unknown>;
};

export async function resolveCustomerCard({
  customerId,
  mode,
  existingRecordId,
  existingCards,
  newCardTypeId,
  newCardNumber,
  addCustomerCard,
}: ResolveCustomerCardInput): Promise<{ cardId: string; cardNumber: string } | null> {
  if (mode === 'existing') {
    const found = existingCards.find((card) => card.id === existingRecordId);
    return found ? { cardId: found.cardId, cardNumber: found.cardNumber } : null;
  }

  const cardId = newCardTypeId.trim();
  const cardNumber = newCardNumber.trim();
  if (!cardId || !cardNumber) return null;

  await addCustomerCard({
    customerId,
    cardId,
    cardNumber,
  });

  return { cardId, cardNumber };
}
