import { useState } from 'react';
import { toast } from 'sonner';
import {
  useDecideDeliveryChangeMutation,
  useGetPendingDeliveryChangesQuery,
} from '../services/delivery-change-request.api';
import type { DeliveryChangeRequest } from '../types/delivery-change-request.types';

export function useDeliveryChangeReview() {
  const [selected, setSelected] = useState<DeliveryChangeRequest | null>(null);
  const query = useGetPendingDeliveryChangesQuery();
  const [decide, decisionState] = useDecideDeliveryChangeMutation();

  const submit = async (decision: 'APPROVED' | 'REJECTED', reviewNote: string) => {
    if (!selected) return;
    try {
      await decide({
        deliveryId: selected.deliveryId,
        decision,
        reviewNote: reviewNote.trim() || null,
      }).unwrap();
      toast.success(`Delivery change ${decision.toLowerCase()}`);
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to review delivery change');
    }
  };

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    selected,
    open: setSelected,
    close: () => setSelected(null),
    submit,
    isSubmitting: decisionState.isLoading,
  };
}
