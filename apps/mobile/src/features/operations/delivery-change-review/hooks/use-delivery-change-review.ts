import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { decideDeliveryChangeReview, listPendingDeliveryChangeReviews } from '../services';
import type { DeliveryChangeDecision, DeliveryChangeReview } from '../types';

export function useDeliveryChangeReview(canReview: boolean) {
  const { withAuth } = useAuth();
  const [requests, setRequests] = useState<DeliveryChangeReview[]>([]);
  const [selected, setSelected] = useState<DeliveryChangeReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canReview) return;
    setLoading(true);
    try {
      setRequests(await withAuth(listPendingDeliveryChangeReviews));
    } catch (error) {
      notifyError('Reviews unavailable', getMobileErrorMessage(error, '') || 'Try again.');
    } finally {
      setLoading(false);
    }
  }, [canReview, withAuth]);

  useEffect(() => void load(), [load]);

  const decide = useCallback(
    async (decision: DeliveryChangeDecision, reviewNote: string) => {
      if (!selected || !canReview) return;
      setSaving(true);
      try {
        await withAuth((token) =>
          decideDeliveryChangeReview(token, {
            deliveryId: selected.deliveryId,
            decision,
            reviewNote: reviewNote.trim() || null,
          }),
        );
        notifySuccess(`The rider request was ${decision.toLowerCase()}.`, 'Review saved');
        setSelected(null);
        await load();
      } catch (error) {
        notifyError('Decision not saved', getMobileErrorMessage(error, '') || 'Try again.');
      } finally {
        setSaving(false);
      }
    },
    [canReview, load, selected, withAuth],
  );

  return { requests, selected, setSelected, loading, saving, load, decide };
}
