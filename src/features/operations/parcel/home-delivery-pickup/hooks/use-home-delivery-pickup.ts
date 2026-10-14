import { useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useReturnHomeDeliveryToPickupMutation } from '../services';

export function useHomeDeliveryPickup() {
  const [returnToPickup, { isLoading: isReturningToPickup }] =
    useReturnHomeDeliveryToPickupMutation();
  const onReturnToPickup = useCallback(
    async (parcel: { id: string }) => {
      try {
        await returnToPickup(parcel.id).unwrap();
        toast.success('Parcel returned to main office — Awaiting Pickup');
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, '') || 'Failed to return parcel to pickup');
        return false;
      }
    },
    [returnToPickup],
  );
  return { onReturnToPickup, isReturningToPickup };
}
