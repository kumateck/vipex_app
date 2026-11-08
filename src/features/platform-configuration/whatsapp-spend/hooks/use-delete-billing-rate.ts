import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useDeleteWhatsAppBillingRateMutation } from '../services';
import type { PricePeriod } from '../types';

export function useDeleteBillingRate() {
  const [pending, setPending] = useState<PricePeriod | null>(null);
  const [remove, { isLoading: isDeleting }] = useDeleteWhatsAppBillingRateMutation();

  const cancel = useCallback(() => setPending(null), []);
  const confirm = useCallback(async () => {
    if (!pending) return;
    try {
      await remove(pending.id).unwrap();
      toast.success(`Price from ${pending.effectiveFrom} deleted`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the price'));
    } finally {
      setPending(null);
    }
  }, [pending, remove]);

  return { pending, request: setPending, cancel, confirm, isDeleting };
}
