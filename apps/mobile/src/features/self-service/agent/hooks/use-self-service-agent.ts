import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import {
  claimSelfServiceDraft,
  completeSelfServiceDraft,
  listSelfServiceDrafts,
} from '../services/self-service-agent.service';
import type { CompleteSelfServiceDraftInput, SelfServiceDraft } from '../types';

export function useSelfServiceAgent(canRead: boolean, canComplete: boolean) {
  const { withAuth } = useAuth();
  const [drafts, setDrafts] = useState<SelfServiceDraft[]>([]);
  const [selected, setSelected] = useState<SelfServiceDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      setDrafts(await withAuth(listSelfServiceDrafts));
    } catch (error) {
      notifyError('Drafts unavailable', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  }, [canRead, withAuth]);

  useEffect(() => void load(), [load]);

  const claim = useCallback(async () => {
    if (!selected || !canComplete) return;
    setSaving(true);
    try {
      const claimed = await withAuth((token) => claimSelfServiceDraft(token, selected.id));
      setSelected(claimed);
      notifySuccess('You can now complete this booking.', 'Draft claimed');
      await load();
    } catch (error) {
      notifyError('Could not claim draft', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [canComplete, load, selected, withAuth]);

  const complete = useCallback(
    async (input: CompleteSelfServiceDraftInput) => {
      if (!canComplete) return null;
      setSaving(true);
      try {
        const result = await withAuth((token) => completeSelfServiceDraft(token, input));
        notifySuccess(result.parcels[0]?.trackingCode ?? result.bookingId, 'Booking completed');
        setSelected(null);
        await load();
        return result;
      } catch (error) {
        notifyError('Completion failed', error instanceof Error ? error.message : 'Try again.');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [canComplete, load, withAuth],
  );

  return { drafts, selected, setSelected, loading, saving, load, claim, complete };
}
