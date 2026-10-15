import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import {
  claimSelfServiceDraft,
  completeSelfServiceDraft,
  listSelfServiceDrafts,
  updateSelfServiceDraft,
} from '../services/self-service-agent.service';
import type {
  CompleteSelfServiceDraftInput,
  SelfServiceDraft,
  UpdateSelfServiceDraftInput,
} from '../types';
import { filterSelfServiceDrafts } from '../utils';

export function useSelfServiceAgent(canRead: boolean, canComplete: boolean) {
  const { withAuth } = useAuth();
  const [drafts, setDrafts] = useState<SelfServiceDraft[]>([]);
  const [selected, setSelected] = useState<SelfServiceDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openingDraftId, setOpeningDraftId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const visibleDrafts = useMemo(() => filterSelfServiceDrafts(drafts, search), [drafts, search]);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      setDrafts(await withAuth(listSelfServiceDrafts));
    } catch (error) {
      notifyError('Drafts unavailable', getMobileErrorMessage(error, '') || 'Try again.');
    } finally {
      setLoading(false);
    }
  }, [canRead, withAuth]);

  useEffect(() => void load(), [load]);

  const open = useCallback(
    async (draft: SelfServiceDraft) => {
      if (!canComplete || draft.claimedBy) {
        setSelected(draft);
        return;
      }
      setSaving(true);
      setOpeningDraftId(draft.id);
      try {
        const claimed = await withAuth((token) => claimSelfServiceDraft(token, draft.id));
        setSelected(claimed);
        await load();
      } catch (error) {
        notifyError('Could not open draft', getMobileErrorMessage(error, '') || 'Try again.');
      } finally {
        setOpeningDraftId(null);
        setSaving(false);
      }
    },
    [canComplete, load, withAuth],
  );

  const claim = useCallback(async () => {
    if (!selected || !canComplete) return;
    setSaving(true);
    try {
      const claimed = await withAuth((token) => claimSelfServiceDraft(token, selected.id));
      setSelected(claimed);
      notifySuccess('You can now complete this booking.', 'Draft claimed');
      await load();
    } catch (error) {
      notifyError('Could not claim draft', getMobileErrorMessage(error, '') || 'Try again.');
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
        notifyError('Completion failed', getMobileErrorMessage(error, '') || 'Try again.');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [canComplete, load, withAuth],
  );

  const updateDraft = useCallback(
    async (input: UpdateSelfServiceDraftInput) => {
      if (!canComplete) return false;
      setSaving(true);
      try {
        const updated = await withAuth((token) => updateSelfServiceDraft(token, input));
        setSelected(updated);
        notifySuccess('Booking details saved.', 'Booking updated');
        await load();
        return true;
      } catch (error) {
        notifyError('Could not update booking', getMobileErrorMessage(error, '') || 'Try again.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [canComplete, load, withAuth],
  );

  return {
    drafts,
    visibleDrafts,
    search,
    setSearch,
    selected,
    setSelected,
    loading,
    saving,
    openingDraftId,
    load,
    open,
    claim,
    complete,
    updateDraft,
  };
}
