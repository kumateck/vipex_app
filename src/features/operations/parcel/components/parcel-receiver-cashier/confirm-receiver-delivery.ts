import type { CustomerCardRecord } from '@/features/customers/api';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { buildReceiverReceiptData } from './build-receiver-receipt-data';
import { resolveCustomerCard } from './resolve-customer-card';
import type { CardMode, HandoverTarget } from './receiver-cashier-types';
import { formatCurrency } from './receiver-cashier-utils';

type ConfirmReceiverDeliveryArgs = {
  selectedParcel: ParcelSearchRow;
  pickerStaffId: string;
  paymentAmount: string;
  storagePaymentAmount: string;
  receiverDuePsw: number;
  storageOutstandingPsw: number;
  canWaiveStorageAccrual: boolean;
  handoverTarget: HandoverTarget;
  mainCardMode: CardMode;
  mainExistingCardRecordId: string;
  mainNewCardTypeId: string;
  mainNewCardNumber: string;
  mainReceiverCards: CustomerCardRecord[];
  secondCardMode: CardMode;
  secondExistingCardRecordId: string;
  secondNewCardTypeId: string;
  secondNewCardNumber: string;
  secondNewName: string;
  secondNewPhone: string;
  secondReceiverCards: CustomerCardRecord[];
  paymentMethod: string;
  destinationBranchName: string;
  destinationLocationName: string;
  receiverOtpVerificationToken: string;
  momoTransactionId?: string | null;
  addCustomerCard: (args: {
    customerId: string;
    cardId: string;
    cardNumber: string;
  }) => Promise<unknown>;
  createCustomer: (args: { fullname: string; telephone: string }) => Promise<{ id: string }>;
  collectReceiverAndDeliver: (args: {
    parcelId: string;
    amountCedis: number | null;
    storageAmountCedis: number | null;
    method: number;
    confirmedBy: string;
    cardId: string | null;
    cardNumber: string | null;
    secondReceiverId: string | null;
    secondCardId: string | null;
    secondCardNumber: string | null;
    receiverOtpVerificationToken: string;
    receiverOtpTarget: HandoverTarget;
    momoTransactionId?: string | null;
  }) => Promise<{
    payment: {
      amounts: {
        vatCedis: number;
        getfundCedis: number;
        nhilCedis: number;
        covidCedis: number;
        taxTotalCedis: number;
      };
    } | null;
  }>;
};

export async function confirmReceiverDelivery({
  selectedParcel,
  pickerStaffId,
  paymentAmount,
  storagePaymentAmount,
  receiverDuePsw,
  storageOutstandingPsw,
  canWaiveStorageAccrual,
  handoverTarget,
  mainCardMode,
  mainExistingCardRecordId,
  mainNewCardTypeId,
  mainNewCardNumber,
  mainReceiverCards,
  secondCardMode,
  secondExistingCardRecordId,
  secondNewCardTypeId,
  secondNewCardNumber,
  secondNewName,
  secondNewPhone,
  secondReceiverCards,
  paymentMethod,
  destinationBranchName,
  destinationLocationName,
  receiverOtpVerificationToken,
  momoTransactionId,
  addCustomerCard,
  createCustomer,
  collectReceiverAndDeliver,
}: ConfirmReceiverDeliveryArgs) {
  if (!pickerStaffId) throw new Error('Select shelf picker staff');
  if (!receiverOtpVerificationToken) {
    throw new Error('Verify the receiver OTP before completing handover');
  }

  const receiverAmount = Number(paymentAmount);
  if (receiverDuePsw > 0 && (Number.isNaN(receiverAmount) || receiverAmount <= 0)) {
    throw new Error('Enter a valid payment amount');
  }
  if (receiverDuePsw > 0 && Math.abs(receiverAmount - receiverDuePsw / 100) > 0.00001) {
    throw new Error(
      `Receiver cashier must collect exactly GHS ${(receiverDuePsw / 100).toFixed(2)}`,
    );
  }

  const storageAmount = Number(storagePaymentAmount || 0);
  if (storageOutstandingPsw > 0 && (Number.isNaN(storageAmount) || storageAmount <= 0)) {
    throw new Error(
      canWaiveStorageAccrual
        ? `Storage accrual is outstanding (${formatCurrency(storageOutstandingPsw)}). Collect it or waive with reason before handover.`
        : `Storage accrual is outstanding (${formatCurrency(storageOutstandingPsw)}). Collect it before handover.`,
    );
  }

  const mainCard = await resolveCustomerCard({
    customerId: selectedParcel.receiverId,
    mode: mainCardMode,
    existingRecordId: mainExistingCardRecordId,
    existingCards: mainReceiverCards,
    newCardTypeId: mainNewCardTypeId,
    newCardNumber: mainNewCardNumber,
    addCustomerCard,
  });

  let secondReceiverId = selectedParcel.secondReceiverId;
  let secondCard: { cardId: string; cardNumber: string } | null = null;
  if (handoverTarget === 'second') {
    if (!secondReceiverId) {
      const fullname = secondNewName.trim();
      const telephone = normalizePhoneDigits(secondNewPhone);
      if (!fullname || !telephone)
        throw new Error('Second receiver name and telephone are required');
      if (!isTenDigitPhone(telephone)) {
        throw new Error(phoneLengthMessage('Second receiver telephone'));
      }
      const created = await createCustomer({ fullname, telephone });
      secondReceiverId = created.id;
    }

    secondCard = await resolveCustomerCard({
      customerId: secondReceiverId,
      mode: secondCardMode,
      existingRecordId: secondExistingCardRecordId,
      existingCards: secondReceiverCards,
      newCardTypeId: secondNewCardTypeId,
      newCardNumber: secondNewCardNumber,
      addCustomerCard,
    });
  }

  const result = await collectReceiverAndDeliver({
    parcelId: selectedParcel.id,
    amountCedis: receiverDuePsw > 0 ? receiverAmount : null,
    storageAmountCedis: storageOutstandingPsw > 0 ? storageAmount : null,
    method: Number(paymentMethod),
    confirmedBy: pickerStaffId,
    cardId: mainCard?.cardId ?? null,
    cardNumber: mainCard?.cardNumber ?? null,
    secondReceiverId: secondReceiverId ?? null,
    secondCardId: secondCard?.cardId ?? null,
    secondCardNumber: secondCard?.cardNumber ?? null,
    // Must match the fixed 'main' target the OTP was requested/verified
    // against (see use-receiver-otp-actions.ts) — not handoverTarget, which
    // only records who physically collected the parcel.
    receiverOtpVerificationToken,
    receiverOtpTarget: 'main',
    momoTransactionId: momoTransactionId ?? null,
  });

  const linkedSecondReceiverName =
    (selectedParcel as { secondReceiverName?: string | null }).secondReceiverName ?? null;
  const receivedByName =
    handoverTarget === 'second'
      ? secondNewName.trim() || linkedSecondReceiverName || 'Second Receiver'
      : (selectedParcel.receiverName ?? '-');

  const totalChargeCedis = selectedParcel.chargePsw / 100;
  const receiverPaidCedis = receiverDuePsw / 100;
  const senderPaidCedis = Math.max(totalChargeCedis - receiverPaidCedis, 0);

  return {
    receipt: buildReceiverReceiptData({
      parcel: selectedParcel,
      receivedByName,
      destinationBranchName,
      destinationLocationName,
      totalChargeCedis,
      senderPaidCedis,
      receiverPaidCedis,
      taxBreakdown: result.payment ? result.payment.amounts : undefined,
    }),
  };
}
