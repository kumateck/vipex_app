import { useRef } from 'react';
import { toast } from 'sonner';
import {
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
} from '../api/cards.api';
import type { CreateCardFormValues, EditCardFormValues } from '../schemas/card-form.schema';
import { getCardErrorMessage } from '../utils/card-error';

export function useCreateCardAction() {
  const submitLockRef = useRef(false);
  const [createCard, { isLoading: isSubmitting }] = useCreateCardMutation();

  const onSubmit = async (values: CreateCardFormValues) => {
    if (submitLockRef.current) return false;
    submitLockRef.current = true;
    try {
      await createCard(values).unwrap();
      toast.success('Card created successfully');
      return true;
    } catch (error) {
      toast.error(getCardErrorMessage(error));
      return false;
    } finally {
      submitLockRef.current = false;
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateCardAction(id: string) {
  const submitLockRef = useRef(false);
  const [updateCard, { isLoading: isSubmitting }] = useUpdateCardMutation();

  const onSubmit = async (values: EditCardFormValues) => {
    if (submitLockRef.current) return false;
    submitLockRef.current = true;
    try {
      await updateCard({ id, body: values }).unwrap();
      toast.success('Card updated successfully');
      return true;
    } catch (error) {
      toast.error(getCardErrorMessage(error));
      return false;
    } finally {
      submitLockRef.current = false;
    }
  };

  return { onSubmit, isSubmitting };
}

export function useDeleteCardAction() {
  const submitLockRef = useRef(false);
  const [deleteCard, { isLoading: isDeleting }] = useDeleteCardMutation();

  const onDelete = async (id: string) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      await deleteCard(id).unwrap();
      toast.success('Card deleted successfully');
    } catch (error) {
      toast.error(getCardErrorMessage(error));
    } finally {
      submitLockRef.current = false;
    }
  };

  return { onDelete, isDeleting };
}
