import { describe, expect, test } from 'bun:test';
import { resolveCustomerCard } from '@/features/operations/parcel/components/parcel-receiver-cashier/resolve-customer-card';

const existingCard = {
  id: 'customer-card-1',
  cardId: 'card-type-1',
  cardNumber: 'GHA-1234',
  cardName: 'Ghana Card',
};

describe('optional customer card selection', () => {
  test('skips card creation when no card is selected', async () => {
    let creationCount = 0;

    const result = await resolveCustomerCard({
      customerId: 'customer-1',
      mode: 'none',
      existingRecordId: '',
      existingCards: [],
      newCardTypeId: '',
      newCardNumber: '',
      addCustomerCard: async () => {
        creationCount += 1;
      },
    });

    expect(result).toBeNull();
    expect(creationCount).toBe(0);
  });

  test('returns an existing card without creating another record', async () => {
    let creationCount = 0;

    const result = await resolveCustomerCard({
      customerId: 'customer-1',
      mode: 'existing',
      existingRecordId: existingCard.id,
      existingCards: [existingCard],
      newCardTypeId: '',
      newCardNumber: '',
      addCustomerCard: async () => {
        creationCount += 1;
      },
    });

    expect(result).toEqual({ cardId: existingCard.cardId, cardNumber: existingCard.cardNumber });
    expect(creationCount).toBe(0);
  });

  test('creates a card only when add new card is selected', async () => {
    const created: Array<{ customerId: string; cardId: string; cardNumber: string }> = [];

    const result = await resolveCustomerCard({
      customerId: 'customer-1',
      mode: 'new',
      existingRecordId: '',
      existingCards: [],
      newCardTypeId: 'card-type-1',
      newCardNumber: 'GHA-1234',
      addCustomerCard: async (input) => {
        created.push(input);
      },
    });

    expect(result).toEqual({ cardId: 'card-type-1', cardNumber: 'GHA-1234' });
    expect(created).toEqual([
      { customerId: 'customer-1', cardId: 'card-type-1', cardNumber: 'GHA-1234' },
    ]);
  });

  test('requires complete details after add new card is selected', async () => {
    const result = resolveCustomerCard({
      customerId: 'customer-1',
      mode: 'new',
      existingRecordId: '',
      existingCards: [],
      newCardTypeId: '',
      newCardNumber: '',
      addCustomerCard: async () => undefined,
    });

    await expect(result).rejects.toThrow('Select card type and enter card number');
  });
});
