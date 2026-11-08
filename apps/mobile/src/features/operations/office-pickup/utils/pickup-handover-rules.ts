import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { ParcelStatus } from '@mobile/constants/parcel-status';
import type {
  CardSelection,
  DeliveredPatch,
  HandoverTarget,
  PickupCustomerCard,
  PickupParcelDetails,
} from '../types';

export const EMPTY_CARD_SELECTION: CardSelection = {
  mode: 'none',
  existingRecordId: '',
  newCardTypeId: '',
  newCardNumber: '',
};

/** Shelf picker already assigned to the parcel (or its queue ticket), if any. */
export function resolveShelfPickerStaffId(details: PickupParcelDetails): string {
  return details.parcel.shelfPickerStaffId ?? details.pickupQueue?.pickerStaffId ?? '';
}

export type ResolvedCard =
  | { kind: 'none' }
  | { kind: 'existing'; cardId: string; cardNumber: string }
  | { kind: 'new'; cardId: string; cardNumber: string };

/** Validates a card choice with the web's messages; a new card is saved later. */
export function resolveCardSelection(
  selection: CardSelection,
  existingCards: PickupCustomerCard[],
): ResolvedCard {
  if (selection.mode === 'none') return { kind: 'none' };
  if (selection.mode === 'existing') {
    const found = existingCards.find((card) => card.id === selection.existingRecordId);
    if (!found) throw new Error('Select an existing card');
    return { kind: 'existing', cardId: found.cardId, cardNumber: found.cardNumber };
  }
  const cardId = selection.newCardTypeId.trim();
  const cardNumber = selection.newCardNumber.trim();
  if (!cardId || !cardNumber) throw new Error('Select card type and enter card number');
  return { kind: 'new', cardId, cardNumber };
}

/** New second receiver details, checked the way the web dialog checks them. */
export function validateSecondReceiverInput(name: string, phone: string) {
  const fullname = name.trim();
  const telephone = normalizePhoneDigits(phone);
  if (!fullname || !telephone) throw new Error('Second receiver name and telephone are required');
  if (!isTenDigitPhone(telephone)) throw new Error(phoneLengthMessage('Second receiver telephone'));
  return { fullname, telephone };
}

export type ConfirmGate = {
  pickerStaffId: string;
  isPickupOtpRequired: boolean;
  otpVerified: boolean;
  verificationToken: string;
  isPickupQueueEnabled: boolean;
  hasPickupQueue: boolean;
};

/**
 * Why "Confirm Delivered" cannot run yet, or null when it can. Same order
 * and wording as the web Waiting for Pickup dialog.
 */
export function getConfirmBlocker(gate: ConfirmGate): string | null {
  if (gate.isPickupQueueEnabled && !gate.hasPickupQueue) {
    return 'Create a pickup queue ticket for this parcel before handover';
  }
  if (!gate.pickerStaffId) return 'Select shelf picker staff';
  if (gate.isPickupOtpRequired && (!gate.otpVerified || !gate.verificationToken)) {
    return 'Verify the customer collection OTP before confirming delivery';
  }
  return null;
}

/** PATCH /v1/shipments/parcels/:id body that marks the parcel Delivered by Office. */
export function buildDeliveredPatch(input: {
  pickerStaffId: string;
  mainCard: { cardId: string; cardNumber: string } | null;
  handoverTarget: HandoverTarget;
  secondReceiverId: string | null;
  secondCard: { cardId: string; cardNumber: string } | null;
  isPickupOtpRequired: boolean;
  verificationToken: string;
}): DeliveredPatch {
  const isSecond = input.handoverTarget === 'second';
  const patch: DeliveredPatch = {
    status: ParcelStatus.DELIVERED_BY_OFFICE,
    confirmedBy: input.pickerStaffId,
    cardId: input.mainCard?.cardId ?? null,
    cardNumber: input.mainCard?.cardNumber ?? null,
    secondReceiverId: input.secondReceiverId ?? null,
    secondCardId: isSecond ? (input.secondCard?.cardId ?? null) : null,
    secondCardNumber: isSecond ? (input.secondCard?.cardNumber ?? null) : null,
  };
  // The OTP always proves the main receiver's presence, whoever collects.
  if (input.isPickupOtpRequired) {
    patch.receiverOtpVerificationToken = input.verificationToken;
    patch.receiverOtpTarget = 'main';
  }
  return patch;
}
