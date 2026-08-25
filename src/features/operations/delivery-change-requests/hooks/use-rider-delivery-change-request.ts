import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useGetMyPendingDeliveryChangesQuery,
  useRequestDeliveryChangeMutation,
} from '../services/delivery-change-request.api';
import type { DeliveryChangeRequestTarget } from '../types/delivery-change-request.types';

export function useRiderDeliveryChangeRequest() {
  const [selected, setSelected] = useState<DeliveryChangeRequestTarget | null>(null);
  const query = useGetMyPendingDeliveryChangesQuery();
  const [requestChange, requestState] = useRequestDeliveryChangeMutation();
  const pendingParcelIds = useMemo(
    () => new Set((query.data ?? []).map((request) => request.parcelId)),
    [query.data],
  );

  const submit = async (input: {
    requestedDropoffAddress: string;
    requestedDeliveryFeeCedis: string;
    reason: string;
  }) => {
    if (!selected) return;
    try {
      await requestChange({ parcelId: selected.parcelId, ...input }).unwrap();
      toast.success('Address and delivery fee change sent for review');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request delivery change');
    }
  };

  return {
    selected,
    open: setSelected,
    close: () => setSelected(null),
    submit,
    pendingParcelIds,
    isSubmitting: requestState.isLoading,
  };
}
