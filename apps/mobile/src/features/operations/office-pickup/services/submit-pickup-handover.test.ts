import { describe, expect, test } from 'bun:test';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import type { DeliveredPatch, PickupParcel } from '../types';
import { EMPTY_CARD_SELECTION } from '../utils';
import { submitPickupHandover, type PickupHandoverInput } from './submit-pickup-handover';

const parcel = {
  id: 'parcel-1',
  receiverId: 'receiver-1',
  secondReceiverId: null,
  trackingCode: 'TRK',
  bookingCode: 'BK',
  parcelDetails: 'Box',
  destinationId: 'br',
  status: ParcelStatus.AWAITING_PICKUP,
  plannedToBePaidPsw: 0,
} as PickupParcel;

function input(overrides: Partial<PickupHandoverInput> = {}): PickupHandoverInput {
  return {
    parcel,
    pickerStaffId: 'staff',
    handoverTarget: 'main',
    mainCard: EMPTY_CARD_SELECTION,
    mainReceiverCards: [],
    secondCard: EMPTY_CARD_SELECTION,
    secondReceiverCards: [],
    secondNewName: '',
    secondNewPhone: '',
    isPickupOtpRequired: true,
    otpVerified: true,
    verificationToken: 'token',
    isPickupQueueEnabled: false,
    hasPickupQueue: false,
    ...overrides,
  };
}

function recorder() {
  const calls: string[] = [];
  let patch: DeliveredPatch | null = null;
  return {
    calls,
    patch: () => patch,
    api: {
      addCustomerCard: async (card: { customerId: string; cardNumber: string }) => {
        calls.push(`card:${card.customerId}:${card.cardNumber}`);
      },
      resolveSecondReceiver: async (person: { fullname: string }) => {
        calls.push(`second:${person.fullname}`);
        return { id: 'second-1' };
      },
      markDelivered: async (id: string, body: DeliveredPatch) => {
        calls.push(`deliver:${id}`);
        patch = body;
        return { id };
      },
    },
  };
}

describe('submit office pickup handover', () => {
  test('marks the parcel delivered with the verified OTP token', async () => {
    const r = recorder();
    await submitPickupHandover(input(), r.api);
    expect(r.calls).toEqual(['deliver:parcel-1']);
    expect(r.patch()).toMatchObject({
      status: ParcelStatus.DELIVERED_BY_OFFICE,
      confirmedBy: 'staff',
      receiverOtpVerificationToken: 'token',
      receiverOtpTarget: 'main',
    });
  });

  test('refuses before writing anything when the OTP is not verified', async () => {
    const r = recorder();
    await expect(submitPickupHandover(input({ otpVerified: false }), r.api)).rejects.toThrow(
      'Verify the customer collection OTP before confirming delivery',
    );
    expect(r.calls).toEqual([]);
  });

  test('creates a new second receiver and saves new cards before delivering', async () => {
    const r = recorder();
    await submitPickupHandover(
      input({
        handoverTarget: 'second',
        mainCard: { mode: 'new', existingRecordId: '', newCardTypeId: 'gh', newCardNumber: 'M1' },
        secondCard: { mode: 'new', existingRecordId: '', newCardTypeId: 'gh', newCardNumber: 'S1' },
        secondNewName: 'Kofi',
        secondNewPhone: '0241234567',
      }),
      r.api,
    );
    expect(r.calls).toEqual([
      'card:receiver-1:M1',
      'second:Kofi',
      'card:second-1:S1',
      'deliver:parcel-1',
    ]);
    expect(r.patch()).toMatchObject({ secondReceiverId: 'second-1', secondCardNumber: 'S1' });
  });

  test('validates the second receiver before saving the main receiver card', async () => {
    const r = recorder();
    await expect(
      submitPickupHandover(
        input({
          handoverTarget: 'second',
          mainCard: { mode: 'new', existingRecordId: '', newCardTypeId: 'gh', newCardNumber: 'M1' },
          secondNewName: 'Kofi',
          secondNewPhone: '024',
        }),
        r.api,
      ),
    ).rejects.toThrow('exactly 10 digits');
    expect(r.calls).toEqual([]);
  });

  test('blocks queue branches until a queue ticket exists', async () => {
    const r = recorder();
    await expect(
      submitPickupHandover(input({ isPickupQueueEnabled: true, hasPickupQueue: false }), r.api),
    ).rejects.toThrow('queue ticket');
    expect(r.calls).toEqual([]);
  });

  test('rejects a missing main receiver before any writes', async () => {
    const r = recorder();
    await expect(
      submitPickupHandover(input({ parcel: { ...parcel, receiverId: undefined } }), r.api),
    ).rejects.toThrow('no main receiver');
    expect(r.calls).toEqual([]);
  });

  test('preserves a linked second receiver when the main receiver collects', async () => {
    const r = recorder();
    await submitPickupHandover(
      input({ parcel: { ...parcel, secondReceiverId: 'linked-second' } }),
      r.api,
    );
    expect(r.calls).toEqual(['deliver:parcel-1']);
    expect(r.patch()).toMatchObject({
      secondReceiverId: 'linked-second',
      secondCardId: null,
      secondCardNumber: null,
    });
  });

  test('uses an existing second receiver card without creating records', async () => {
    const r = recorder();
    await submitPickupHandover(
      input({
        parcel: { ...parcel, secondReceiverId: 'linked-second' },
        handoverTarget: 'second',
        secondCard: { ...EMPTY_CARD_SELECTION, mode: 'existing', existingRecordId: 'record' },
        secondReceiverCards: [
          {
            id: 'record',
            customerId: 'linked-second',
            cardId: 'gh',
            cardName: 'Ghana Card',
            cardNumber: 'S1',
          },
        ],
      }),
      r.api,
    );
    expect(r.calls).toEqual(['deliver:parcel-1']);
    expect(r.patch()).toMatchObject({ secondReceiverId: 'linked-second', secondCardNumber: 'S1' });
  });

  test('omits verification fields when the branch disables pickup OTP', async () => {
    const r = recorder();
    await submitPickupHandover(
      input({
        isPickupOtpRequired: false,
        otpVerified: false,
        verificationToken: '',
      }),
      r.api,
    );
    expect(r.patch()).not.toHaveProperty('receiverOtpVerificationToken');
    expect(r.patch()).not.toHaveProperty('receiverOtpTarget');
  });

  test.each(['card', 'second', 'deliver'] as const)(
    'propagates a failed %s request and stops the remaining writes',
    async (failure) => {
      const r = recorder();
      const api = {
        addCustomerCard: async (card: { customerId: string; cardNumber: string }) => {
          await r.api.addCustomerCard(card);
          if (failure === 'card') throw new Error('card unavailable');
        },
        resolveSecondReceiver: async (person: { fullname: string }) => {
          const result = await r.api.resolveSecondReceiver(person);
          if (failure === 'second') throw new Error('second unavailable');
          return result;
        },
        markDelivered: async (id: string, body: DeliveredPatch) => {
          await r.api.markDelivered(id, body);
          throw new Error('deliver unavailable');
        },
      };
      await expect(
        submitPickupHandover(
          input({
            handoverTarget: 'second',
            mainCard: {
              ...EMPTY_CARD_SELECTION,
              mode: 'new',
              newCardTypeId: 'gh',
              newCardNumber: 'M1',
            },
            secondNewName: 'Kofi',
            secondNewPhone: '0241234567',
          }),
          api,
        ),
      ).rejects.toThrow(`${failure} unavailable`);
      expect(r.calls).toEqual(
        failure === 'card'
          ? ['card:receiver-1:M1']
          : failure === 'second'
            ? ['card:receiver-1:M1', 'second:Kofi']
            : ['card:receiver-1:M1', 'second:Kofi', 'deliver:parcel-1'],
      );
    },
  );
});
