import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useLazyReadDeliveryFeeQuery, useEditDeliveryFeeMutation } from '../services';
import type { DeliveryFeeContext } from '../types';
import { getDeliveryFeeInputError } from '../utils';

export function useDeliveryFeeEdit(parcelId: string) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<DeliveryFeeContext | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [load, { isFetching }] = useLazyReadDeliveryFeeQuery();
  const [update, { isLoading: isSaving }] = useEditDeliveryFeeMutation();

  const reload = useCallback(async () => {
    setContext(null);
    setError('');
    try {
      const latest = await load(parcelId, false).unwrap();
      setContext(latest);
      setAmount((latest.chargePsw / 100).toFixed(2));
    } catch (failure) {
      setError(getErrorMessage(failure, '') || 'Could not load the current delivery fee');
    }
  }, [load, parcelId]);

  const show = useCallback(() => {
    setReason('');
    setAmount('');
    setOpen(true);
    void reload();
  }, [reload]);
  const close = useCallback(() => {
    if (!isSaving) setOpen(false);
  }, [isSaving]);
  const save = useCallback(async () => {
    if (!context || isSaving || isFetching) return;
    const inputError = getDeliveryFeeInputError(amount);
    if (inputError || reason.trim().length < 3) {
      setError(inputError || 'Enter a reason of at least three characters');
      return;
    }
    try {
      await update({
        parcelId,
        deliveryFeeCedis: amount.trim(),
        reason: reason.trim(),
        expectedChargePsw: context.chargePsw,
        expectedUpdatedAt: context.updatedAt,
      }).unwrap();
      toast.success('Delivery fee updated');
      setOpen(false);
    } catch (failure) {
      setError(getErrorMessage(failure, '') || 'Could not update the delivery fee');
    }
  }, [amount, context, isFetching, isSaving, parcelId, reason, update]);

  return {
    open,
    context,
    amount,
    setAmount,
    reason,
    setReason,
    error,
    isFetching,
    isSaving,
    show,
    close,
    reload,
    save,
  };
}
