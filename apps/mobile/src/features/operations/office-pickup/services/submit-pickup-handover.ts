import { isHandoverSignature } from '@/shared/shipments/handover-signature';
import type {
  CardSelection,
  SignedPickupConfirmation,
  HandoverTarget,
  PickupCustomerCard,
  PickupParcel,
} from '../types';
import {
  buildSignedPickupConfirmation,
  getConfirmBlocker,
  resolveCardSelection,
  validateSecondReceiverInput,
  type ConfirmGate,
} from '../utils';

export type PickupHandoverInput = Omit<ConfirmGate, 'pickerStaffId'> & {
  parcel: PickupParcel;
  pickerStaffId: string;
  handoverTarget: HandoverTarget;
  mainCard: CardSelection;
  mainReceiverCards: PickupCustomerCard[];
  secondCard: CardSelection;
  secondReceiverCards: PickupCustomerCard[];
  secondNewName: string;
  secondNewPhone: string;
};

export type PickupHandoverApi = {
  addCustomerCard: (input: {
    customerId: string;
    cardId: string;
    cardNumber: string;
  }) => Promise<unknown>;
  resolveSecondReceiver: (input: {
    fullname: string;
    telephone: string;
  }) => Promise<{ id: string }>;
  markDelivered: (parcelId: string, patch: SignedPickupConfirmation) => Promise<{ id: string }>;
};

async function saveCard(
  api: PickupHandoverApi,
  customerId: string,
  selection: CardSelection,
  existingCards: PickupCustomerCard[],
) {
  const card = resolveCardSelection(selection, existingCards);
  if (card.kind === 'none') return null;
  if (card.kind === 'new') {
    await api.addCustomerCard({ customerId, cardId: card.cardId, cardNumber: card.cardNumber });
  }
  return { cardId: card.cardId, cardNumber: card.cardNumber };
}

/**
 * Completes an office pickup the way the web Waiting for Pickup dialog does:
 * check the gates, record ID cards (adding new ones), create the second
 * receiver when needed, then mark the parcel Delivered by Office.
 */
export async function submitPickupHandover(input: PickupHandoverInput, api: PickupHandoverApi) {
  const blocker = getConfirmBlocker(input);
  if (blocker) throw new Error(blocker);
  if (!isHandoverSignature(input.signatureImage))
    throw new Error('Capture a valid collector signature');
  const { parcel } = input;
  if (!parcel.receiverId) throw new Error('Parcel has no main receiver on file');

  // Validate everything before writing anything, so a bad field saves no cards.
  resolveCardSelection(input.mainCard, input.mainReceiverCards);
  const isSecond = input.handoverTarget === 'second';
  const newSecond =
    isSecond && !parcel.secondReceiverId
      ? validateSecondReceiverInput(input.secondNewName, input.secondNewPhone)
      : null;
  if (isSecond) resolveCardSelection(input.secondCard, input.secondReceiverCards);

  const mainCard = await saveCard(api, parcel.receiverId, input.mainCard, input.mainReceiverCards);
  let secondReceiverId = parcel.secondReceiverId ?? null;
  let secondCard: { cardId: string; cardNumber: string } | null = null;
  if (isSecond) {
    if (newSecond) secondReceiverId = (await api.resolveSecondReceiver(newSecond)).id;
    if (!secondReceiverId) throw new Error('Second receiver could not be resolved');
    secondCard = await saveCard(api, secondReceiverId, input.secondCard, input.secondReceiverCards);
  }

  const patch = buildSignedPickupConfirmation({
    pickerStaffId: input.pickerStaffId,
    mainCard,
    handoverTarget: input.handoverTarget,
    secondReceiverId,
    secondCard,
    isPickupOtpRequired: input.isPickupOtpRequired,
    verificationToken: input.verificationToken,
    signatureImage: input.signatureImage,
    expectedMainReceiverId: parcel.receiverId,
    expectedSecondReceiverId: parcel.secondReceiverId ?? null,
  });
  return api.markDelivered(parcel.id, patch);
}
