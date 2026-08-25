import { useCallback, useEffect, useMemo, useState } from 'react';
import { hapticError, hapticSuccess } from '@mobile/lib/haptics';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { listMyPendingDeliveryChanges, submitRiderDeliveryChange } from '../services';
import type {
  RiderDeliveryChangeInput,
  RiderDeliveryChangeRequest,
  RiderDeliveryChangeTarget,
} from '../types/delivery-change-request.types';

export function useRiderDeliveryChangeRequests(onChanged: () => void | Promise<void>) {
  const { withAuth } = useAuth();
  const [requests, setRequests] = useState<RiderDeliveryChangeRequest[]>([]);
  const [target, setTarget] = useState<RiderDeliveryChangeTarget | null>(null);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);

  const loadChangeRequests = useCallback(async () => {
    try {
      const rows = await withAuth(listMyPendingDeliveryChanges);
      setRequests(rows);
    } catch (error) {
      notifyError(
        'Change requests unavailable',
        error instanceof Error ? error.message : 'Could not load delivery change requests.',
      );
    }
  }, [withAuth]);

  useEffect(() => {
    void loadChangeRequests();
  }, [loadChangeRequests]);

  const pendingChangeParcelIds = useMemo(
    () => new Set(requests.map((request) => request.parcelId)),
    [requests],
  );

  const submitChangeRequest = useCallback(
    async (input: RiderDeliveryChangeInput) => {
      if (!target) return false;
      setIsSubmittingChange(true);
      try {
        await withAuth((token) => submitRiderDeliveryChange(token, target.parcelId, input));
        notifySuccess('Address and delivery fee change sent for review.');
        void hapticSuccess();
        setTarget(null);
        await Promise.all([loadChangeRequests(), onChanged()]);
        return true;
      } catch (error) {
        notifyError(
          'Request failed',
          error instanceof Error ? error.message : 'Could not send the delivery change request.',
        );
        void hapticError();
        return false;
      } finally {
        setIsSubmittingChange(false);
      }
    },
    [loadChangeRequests, onChanged, target, withAuth],
  );

  return {
    changeRequestTarget: target,
    openChangeRequest: setTarget,
    closeChangeRequest: () => setTarget(null),
    submitChangeRequest,
    pendingChangeParcelIds,
    isSubmittingChange,
  };
}
