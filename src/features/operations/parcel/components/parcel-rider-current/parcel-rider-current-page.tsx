import { useState } from 'react';
import { toast } from 'sonner';
import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import {
  useAddCustomerCardMutation,
  useCreateCustomerMutation,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
} from '@/features/customers/api';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  DeliveryChangeRequestDialog,
  useRiderDeliveryChangeRequest,
} from '@/features/operations/delivery-change-requests';
import {
  type RiderDoorstepRecord,
  useListRiderDoorstepParcelsQuery,
  useRiderGivenParcelToCustomerMutation,
  useRiderReturnParcelToOfficeMutation,
} from '../../api/parcel.api';
import { DeliveryHandoverDialog } from './delivery-handover-dialog';
import { RiderCurrentTable } from './rider-current-table';
import type { CardMode, HandoverTarget } from './types';

export function ParcelRiderCurrentPage() {
  const user = useAuthStore((state) => state.user);
  const riderUserId = user?.id ?? '';

  const [selected, setSelected] = useState<RiderDoorstepRecord | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | undefined>(undefined);
  const [handoverTarget, setHandoverTarget] = useState<HandoverTarget>('main');

  const [mainCardMode, setMainCardMode] = useState<CardMode>('none');
  const [mainExistingCardRecordId, setMainExistingCardRecordId] = useState('');
  const [mainNewCardTypeId, setMainNewCardTypeId] = useState('');
  const [mainNewCardNumber, setMainNewCardNumber] = useState('');

  const [secondCardMode, setSecondCardMode] = useState<CardMode>('none');
  const [secondExistingCardRecordId, setSecondExistingCardRecordId] = useState('');
  const [secondNewCardTypeId, setSecondNewCardTypeId] = useState('');
  const [secondNewCardNumber, setSecondNewCardNumber] = useState('');
  const [secondNewName, setSecondNewName] = useState('');
  const [secondNewPhone, setSecondNewPhone] = useState('');

  const { data } = useListRiderDoorstepParcelsQuery(
    { riderUserId, mode: 'current' },
    { skip: !riderUserId },
  );
  const { data: cardOptions = [] } = useListCardOptionsQuery();
  const { data: mainReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selected?.receiverId ?? '' },
    { skip: !selected?.receiverId },
  );
  const { data: secondReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selected?.secondReceiverId ?? '' },
    { skip: !selected?.secondReceiverId },
  );

  const [addCustomerCard] = useAddCustomerCardMutation();
  const [createCustomer] = useCreateCustomerMutation();
  const [uploadImage, { isLoading: isUploadingSignature }] = useUploadImageMutation();
  const [riderGiven, { isLoading: isConfirming }] = useRiderGivenParcelToCustomerMutation();
  const [riderReturned, { isLoading: isReturning }] = useRiderReturnParcelToOfficeMutation();
  const changeRequest = useRiderDeliveryChangeRequest();

  const openDeliveryDetails = (row: RiderDoorstepRecord) => {
    setSelected(row);
    setSignatureImage(undefined);
    setHandoverTarget(row.secondReceiverId ? 'second' : 'main');
    setMainCardMode('none');
    setMainExistingCardRecordId('');
    setMainNewCardTypeId('');
    setMainNewCardNumber('');
    setSecondCardMode('none');
    setSecondExistingCardRecordId('');
    setSecondNewCardTypeId('');
    setSecondNewCardNumber('');
    setSecondNewName('');
    setSecondNewPhone('');
  };

  const handleReturn = async (row: RiderDoorstepRecord) => {
    try {
      await riderReturned({ parcelId: row.parcelId, riderUserId }).unwrap();
      toast.success('Parcel returned to branch pickup');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to return parcel');
    }
  };

  async function resolveCardForCustomer(input: {
    customerId: string;
    mode: CardMode;
    existingRecordId: string;
    existingCards: Array<{ id: string; cardId: string; cardNumber: string }>;
    newCardTypeId: string;
    newCardNumber: string;
  }): Promise<{ cardId: string; cardNumber: string } | null> {
    if (input.mode === 'none') return null;

    if (input.mode === 'existing') {
      const found = input.existingCards.find((card) => card.id === input.existingRecordId);
      if (!found) throw new Error('Select an existing card');
      return { cardId: found.cardId, cardNumber: found.cardNumber };
    }

    const cardId = input.newCardTypeId.trim();
    const cardNumber = input.newCardNumber.trim();
    if (!cardId || !cardNumber) throw new Error('Select card type and enter card number');

    await addCustomerCard({ customerId: input.customerId, cardId, cardNumber }).unwrap();
    return { cardId, cardNumber };
  }

  const onConfirm = async () => {
    if (!selected) return;
    if (!signatureImage) {
      toast.error('Receiver signature is required');
      return;
    }

    try {
      let signatureUrl = signatureImage;
      if (signatureImage.startsWith('data:')) {
        const upload = await uploadImage({
          modelType: 'delivery-handover-signature',
          modelId: selected.parcelId,
          dataUrl: signatureImage,
          fileName: `${selected.parcelId}-handover-signature.png`,
        }).unwrap();
        signatureUrl = upload.url;
      }

      const mainCard = await resolveCardForCustomer({
        customerId: selected.receiverId,
        mode: mainCardMode,
        existingRecordId: mainExistingCardRecordId,
        existingCards: mainReceiverCards,
        newCardTypeId: mainNewCardTypeId,
        newCardNumber: mainNewCardNumber,
      });

      let secondReceiverId = selected.secondReceiverId;
      let secondCard: { cardId: string; cardNumber: string } | null = null;

      if (handoverTarget === 'second') {
        if (!secondReceiverId) {
          const fullname = secondNewName.trim();
          const telephone = normalizePhoneDigits(secondNewPhone);
          if (!fullname || !telephone) {
            toast.error('Second receiver name and telephone are required');
            return;
          }
          if (!isTenDigitPhone(telephone)) {
            toast.error(phoneLengthMessage('Second receiver telephone'));
            return;
          }
          const created = await createCustomer({ fullname, telephone }).unwrap();
          secondReceiverId = created.id;
        }

        secondCard = await resolveCardForCustomer({
          customerId: secondReceiverId,
          mode: secondCardMode,
          existingRecordId: secondExistingCardRecordId,
          existingCards: secondReceiverCards,
          newCardTypeId: secondNewCardTypeId,
          newCardNumber: secondNewCardNumber,
        });
      }

      await riderGiven({
        parcelId: selected.parcelId,
        riderUserId,
        signatureImage: signatureUrl,
        secondReceiverId: secondReceiverId ?? null,
        cardId: mainCard?.cardId ?? null,
        cardNumber: mainCard?.cardNumber ?? null,
        secondCardId: secondCard?.cardId ?? null,
        secondCardNumber: secondCard?.cardNumber ?? null,
      }).unwrap();
      toast.success('Handover confirmed');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm handover');
    }
  };

  return (
    <div className="w-full space-y-4 p-4">
      <RiderCurrentTable
        data={data}
        isReturning={isReturning}
        pendingParcelIds={changeRequest.pendingParcelIds}
        onOpenDeliveryDetails={openDeliveryDetails}
        onRequestChange={(row) =>
          changeRequest.open({
            parcelId: row.parcelId,
            bookingCode: row.bookingCode,
            currentDropoffAddress: row.dropoffAddress,
            currentChargePsw: row.deliveryFeePsw,
          })
        }
        onReturn={handleReturn}
      />

      <DeliveryChangeRequestDialog
        target={changeRequest.selected}
        isSubmitting={changeRequest.isSubmitting}
        onClose={changeRequest.close}
        onSubmit={changeRequest.submit}
      />

      <DeliveryHandoverDialog
        selected={selected}
        onSignatureImageChange={setSignatureImage}
        handoverTarget={handoverTarget}
        onHandoverTargetChange={setHandoverTarget}
        mainCardMode={mainCardMode}
        onMainCardModeChange={setMainCardMode}
        mainExistingCardRecordId={mainExistingCardRecordId}
        onMainExistingCardRecordIdChange={setMainExistingCardRecordId}
        mainNewCardTypeId={mainNewCardTypeId}
        onMainNewCardTypeIdChange={setMainNewCardTypeId}
        mainNewCardNumber={mainNewCardNumber}
        onMainNewCardNumberChange={setMainNewCardNumber}
        secondCardMode={secondCardMode}
        onSecondCardModeChange={setSecondCardMode}
        secondExistingCardRecordId={secondExistingCardRecordId}
        onSecondExistingCardRecordIdChange={setSecondExistingCardRecordId}
        secondNewCardTypeId={secondNewCardTypeId}
        onSecondNewCardTypeIdChange={setSecondNewCardTypeId}
        secondNewCardNumber={secondNewCardNumber}
        onSecondNewCardNumberChange={setSecondNewCardNumber}
        secondNewName={secondNewName}
        onSecondNewNameChange={setSecondNewName}
        secondNewPhone={secondNewPhone}
        onSecondNewPhoneChange={setSecondNewPhone}
        cardOptions={cardOptions}
        mainReceiverCards={mainReceiverCards}
        secondReceiverCards={secondReceiverCards}
        isConfirming={isConfirming}
        isUploadingSignature={isUploadingSignature}
        onClose={() => setSelected(null)}
        onConfirm={onConfirm}
      />
    </div>
  );
}
