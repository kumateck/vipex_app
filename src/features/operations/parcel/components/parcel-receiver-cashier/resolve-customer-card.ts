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
}: ResolveCustomerCardInput): Promise<{ cardId: string; cardNumber: string }> {
  if (mode === 'existing') {
    const found = existingCards.find((card) => card.id === existingRecordId);
    if (!found) throw new Error('Select an existing card');
    return { cardId: found.cardId, cardNumber: found.cardNumber };
  }

  const cardId = newCardTypeId.trim();
  const cardNumber = newCardNumber.trim();
  if (!cardId || !cardNumber) throw new Error('Select card type and enter card number');

  await addCustomerCard({
    customerId,
    cardId,
    cardNumber,
  });

  return { cardId, cardNumber };
}
