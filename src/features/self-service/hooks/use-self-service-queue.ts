import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { SelfServiceDraftStatus } from '@/db/schemas/enums';
import { useHasPermission } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  type SelfServiceDraft,
  useClaimSelfServiceDraftMutation,
  useListSelfServiceDraftsQuery,
} from '../api/self-service-agent.api';

export function useSelfServiceQueue() {
  const list = useListSelfServiceDraftsQuery();
  const [claimDraft, { isLoading: isClaiming }] = useClaimSelfServiceDraftMutation();
  const [selectedDraft, setSelectedDraft] = useState<SelfServiceDraft | null>(null);
  const canComplete = useHasPermission(PermissionKeys.CanCompleteSelfServiceBookings);
  const navigate = useNavigate();
  const onComplete = async (draft: SelfServiceDraft) => {
    if (!canComplete || isClaiming) return;
    try {
      if (draft.status === SelfServiceDraftStatus.PENDING) await claimDraft(draft.id).unwrap();
      navigate(`/parcels/self-service/${draft.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to open this booking draft');
    }
  };
  return {
    drafts: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error ? getErrorMessage(list.error, 'Unable to load bookings') : null,
    isClaiming,
    canComplete,
    onComplete,
    selectedDraft,
    onView: setSelectedDraft,
    onClose: () => setSelectedDraft(null),
  };
}
