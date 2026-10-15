import { useState } from 'react';
import { toast } from 'sonner';
import ThrowErrorMessage from '@/lib/throw-error';
import { useReturnParcelToSourceMutation } from '../api/parcel.api';

export function useReturnToSource(parcelId: string | null, onClose: () => void) {
  const [reason, setReason] = useState('');
  const [returnToSource, { isLoading }] = useReturnParcelToSourceMutation();

  const close = () => {
    setReason('');
    onClose();
  };

  const submit = async () => {
    if (!parcelId) return;
    const note = reason.trim();
    if (note.length < 5 || note.length > 500) {
      toast.error('Enter a return reason of 5 to 500 characters');
      return;
    }
    try {
      await returnToSource({ id: parcelId, reason: note }).unwrap();
      toast.success('Return to source recorded');
      close();
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return { reason, setReason, isLoading, close, submit };
}
