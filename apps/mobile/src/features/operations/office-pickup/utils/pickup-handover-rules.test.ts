import { describe, expect, test } from 'bun:test';
import type { PickupParcelDetails } from '../types';
import {
  buildSignedPickupConfirmation,
  EMPTY_CARD_SELECTION,
  getConfirmBlocker,
  getCurrentDayPickupQueue,
  isPickupQueueForCurrentDay,
  resolveCardSelection,
  resolveShelfPickerStaffId,
  validateSecondReceiverInput,
} from './pickup-handover-rules';

const cards = [
  {
    id: 'rec-1',
    customerId: 'c1',
    cardId: 'ghana-card',
    cardName: 'Ghana Card',
    cardNumber: 'GHA-1',
  },
];

const ready = {
  pickerStaffId: 'staff',
  isPickupOtpRequired: true,
  otpVerified: true,
  verificationToken: 'token',
  isPickupQueueEnabled: false,
  hasPickupQueue: false,
  signatureImage: 'captured signature',
};

describe('office pickup handover rules', () => {
  test('uses the parcel shelf picker, then only a current-day queue ticket picker', () => {
    const today = new Date(2026, 10, 10, 12);
    const details = (parcel: string | null, queue: string | null) =>
      ({
        parcel: { shelfPickerStaffId: parcel },
        pickupQueue: queue
          ? {
              pickerStaffId: queue,
              queueDate: '2026-11-10T00:00:00.000Z',
              queuedAt: '2026-11-10T10:00:00.000Z',
            }
          : null,
      }) as unknown as PickupParcelDetails;
    expect(resolveShelfPickerStaffId(details('p', 'q'))).toBe('p');
    expect(resolveShelfPickerStaffId(details(null, 'q'), today)).toBe('q');
    const yesterday = {
      ...details(null, 'old'),
      pickupQueue: {
        pickerStaffId: 'old',
        queueDate: '2026-11-09T00:00:00.000Z',
        queuedAt: '2026-11-09T10:00:00.000Z',
      },
    } as unknown as PickupParcelDetails;
    expect(resolveShelfPickerStaffId(yesterday, today)).toBe('');
    expect(getCurrentDayPickupQueue(yesterday, today)).toBeNull();
    expect(isPickupQueueForCurrentDay(yesterday.pickupQueue, today)).toBe(false);
    expect(resolveShelfPickerStaffId(details(null, null), today)).toBe('');
  });

  test('blocks confirmation until all pickup checks are met', () => {
    expect(getConfirmBlocker(ready)).toBeNull();
    expect(getConfirmBlocker({ ...ready, pickerStaffId: '' })).toBe('Select shelf picker staff');
    expect(getConfirmBlocker({ ...ready, otpVerified: false })).toBe(
      'Verify the customer collection OTP before confirming delivery',
    );
    expect(getConfirmBlocker({ ...ready, verificationToken: '' })).not.toBeNull();
    expect(getConfirmBlocker({ ...ready, isPickupQueueEnabled: true })).toContain('queue ticket');
    expect(getConfirmBlocker({ ...ready, signatureImage: '' })).toContain('signature');
  });

  test('lets a branch with pickup OTP disabled confirm without a code', () => {
    expect(
      getConfirmBlocker({
        ...ready,
        isPickupOtpRequired: false,
        otpVerified: false,
        verificationToken: '',
      }),
    ).toBeNull();
  });

  test('resolves card choices with the web messages', () => {
    expect(resolveCardSelection(EMPTY_CARD_SELECTION, cards)).toEqual({ kind: 'none' });
    expect(
      resolveCardSelection(
        { ...EMPTY_CARD_SELECTION, mode: 'existing', existingRecordId: 'rec-1' },
        cards,
      ),
    ).toEqual({ kind: 'existing', cardId: 'ghana-card', cardNumber: 'GHA-1' });
    expect(() =>
      resolveCardSelection({ ...EMPTY_CARD_SELECTION, mode: 'existing' }, cards),
    ).toThrow('Select an existing card');
    expect(() =>
      resolveCardSelection({ ...EMPTY_CARD_SELECTION, mode: 'new', newCardTypeId: 'x' }, cards),
    ).toThrow('Select card type and enter card number');
  });

  test('validates a new second receiver', () => {
    expect(validateSecondReceiverInput(' Ama ', '024-123-4567')).toEqual({
      fullname: 'Ama',
      telephone: '0241234567',
    });
    expect(() => validateSecondReceiverInput('', '0241234567')).toThrow('are required');
    expect(() => validateSecondReceiverInput('Ama', '02412')).toThrow('exactly 10 digits');
  });

  test('sends the signature, collector and main receiver OTP token together', () => {
    expect(
      buildSignedPickupConfirmation({
        pickerStaffId: 'staff',
        mainCard: { cardId: 'ghana-card', cardNumber: 'GHA-1' },
        handoverTarget: 'main',
        secondReceiverId: null,
        secondCard: null,
        isPickupOtpRequired: true,
        verificationToken: 'token',
        signatureImage: ready.signatureImage,
        expectedMainReceiverId: 'main-1',
        expectedSecondReceiverId: null,
      }),
    ).toEqual({
      handoverTarget: 'main',
      signatureImage: ready.signatureImage,
      expectedMainReceiverId: 'main-1',
      expectedSecondReceiverId: null,
      confirmedBy: 'staff',
      cardId: 'ghana-card',
      cardNumber: 'GHA-1',
      secondReceiverId: null,
      secondCardId: null,
      secondCardNumber: null,
      receiverOtpVerificationToken: 'token',
    });
  });

  test('omits OTP fields when the branch does not require pickup OTP', () => {
    const patch = buildSignedPickupConfirmation({
      pickerStaffId: 'staff',
      mainCard: null,
      handoverTarget: 'second',
      secondReceiverId: 'second',
      secondCard: { cardId: 'passport', cardNumber: 'P1' },
      isPickupOtpRequired: false,
      verificationToken: '',
      signatureImage: ready.signatureImage,
      expectedMainReceiverId: 'main-1',
      expectedSecondReceiverId: 'second',
    });
    expect('receiverOtpVerificationToken' in patch).toBe(false);
    expect(patch.secondCardId).toBe('passport');
  });
});
