import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  useAddCustomerCardMutation,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
  useUpdateCustomerCardMutation,
} from '@/features/customers/api';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';

export function useCustomerCards(id: string | undefined, shouldLoadCards: boolean) {
  const [cardId, setCardId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardFrontImageUrl, setCardFrontImageUrl] = useState<string | null>(null);
  const [cardBackImageUrl, setCardBackImageUrl] = useState<string | null>(null);
  const { data: cardOptions = [] } = useListCardOptionsQuery(undefined, {
    skip: !shouldLoadCards,
  });
  const { data: customerCards = [] } = useListCustomerCardsQuery(
    { customerId: id ?? '' },
    { skip: !id || !shouldLoadCards },
  );
  const [addCustomerCard, { isLoading: isAddingCard }] = useAddCustomerCardMutation();
  const [updateCustomerCard, { isLoading: isUpdatingCard }] = useUpdateCustomerCardMutation();
  const [uploadImage] = useUploadImageMutation();

  const handleAddCard = async () => {
    if (!id) return;

    if (!cardId) {
      toast.error('Select a card type');
      return;
    }

    if (!cardNumber.trim()) {
      toast.error('Enter card number');
      return;
    }

    try {
      const createdCard = await addCustomerCard({
        customerId: id,
        cardId,
        cardNumber: cardNumber.trim(),
      }).unwrap();

      let frontImageUrl: string | null = null;
      let backImageUrl: string | null = null;

      if (cardFrontImageUrl?.startsWith('data:')) {
        const uploadedFront = await uploadImage({
          modelType: 'customer-card-front-image',
          modelId: createdCard.id,
          dataUrl: cardFrontImageUrl,
          fileName: `${createdCard.id}-front.png`,
        }).unwrap();
        frontImageUrl = uploadedFront.url;
      } else {
        frontImageUrl = cardFrontImageUrl;
      }

      if (cardBackImageUrl?.startsWith('data:')) {
        const uploadedBack = await uploadImage({
          modelType: 'customer-card-back-image',
          modelId: createdCard.id,
          dataUrl: cardBackImageUrl,
          fileName: `${createdCard.id}-back.png`,
        }).unwrap();
        backImageUrl = uploadedBack.url;
      } else {
        backImageUrl = cardBackImageUrl;
      }

      if (frontImageUrl || backImageUrl) {
        await updateCustomerCard({
          customerId: id,
          cardRecordId: createdCard.id,
          frontImageUrl,
          backImageUrl,
        }).unwrap();
      }

      toast.success('Card added');
      setCardNumber('');
      setCardFrontImageUrl(null);
      setCardBackImageUrl(null);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to add card');
    }
  };

  const handleUpdateCard = async (input: {
    cardRecordId: string;
    cardId: string;
    cardNumber: string;
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
  }) => {
    if (!id) return;

    if (!input.cardId) {
      toast.error('Select a card type');
      return;
    }

    if (!input.cardNumber.trim()) {
      toast.error('Enter card number');
      return;
    }

    try {
      let frontImageUrl = input.frontImageUrl ?? null;
      let backImageUrl = input.backImageUrl ?? null;

      if (frontImageUrl?.startsWith('data:')) {
        const uploadedFront = await uploadImage({
          modelType: 'customer-card-front-image',
          modelId: input.cardRecordId,
          dataUrl: frontImageUrl,
          fileName: `${input.cardRecordId}-front.png`,
        }).unwrap();
        frontImageUrl = uploadedFront.url;
      }

      if (backImageUrl?.startsWith('data:')) {
        const uploadedBack = await uploadImage({
          modelType: 'customer-card-back-image',
          modelId: input.cardRecordId,
          dataUrl: backImageUrl,
          fileName: `${input.cardRecordId}-back.png`,
        }).unwrap();
        backImageUrl = uploadedBack.url;
      }

      await updateCustomerCard({
        customerId: id,
        cardRecordId: input.cardRecordId,
        cardId: input.cardId,
        cardNumber: input.cardNumber.trim(),
        frontImageUrl,
        backImageUrl,
      }).unwrap();

      toast.success('Card updated');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update card');
    }
  };

  return {
    cardId,
    setCardId,
    cardNumber,
    setCardNumber,
    cardFrontImageUrl,
    setCardFrontImageUrl,
    cardBackImageUrl,
    setCardBackImageUrl,
    cardOptions,
    customerCards,
    isAddingCard,
    isUpdatingCard,
    handleAddCard,
    handleUpdateCard,
  };
}
