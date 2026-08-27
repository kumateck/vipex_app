import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { notifyError, notifySuccess, notifyWarning } from '@mobile/lib/notify';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import {
  listOpenDiscrepancies,
  logReceiveDiscrepancy,
  searchDiscrepancyParcels,
  uploadDiscrepancyPhoto,
} from '../services';
import type { DiscrepancyPhoto, DiscrepancyType, OpenParcelDiscrepancy } from '../types';

export function useReceiveDiscrepancies(canRead: boolean) {
  const { session, withAuth } = useAuth();
  const [openItems, setOpenItems] = useState<OpenParcelDiscrepancy[]>([]);
  const [matches, setMatches] = useState<ParcelSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<{
    id: string;
    photo: DiscrepancyPhoto;
  } | null>(null);
  const companyId = session.user?.company?.id ?? session.user?.companyId ?? '';
  const branchId = session.user?.branch?.id ?? session.user?.branchId ?? '';
  const actorUserId = session.user?.id ?? session.user?.sub ?? '';

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const result = await withAuth(listOpenDiscrepancies);
      setOpenItems(result.data);
    } catch (error) {
      notifyError(
        'Discrepancies unavailable',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [canRead, withAuth]);

  useEffect(() => void load(), [load]);

  const searchParcels = useCallback(
    async (search: string) => {
      if (!search.trim() || !companyId) return setMatches([]);
      try {
        const result = await withAuth((token) =>
          searchDiscrepancyParcels(token, companyId, search.trim()),
        );
        setMatches(result.data);
      } catch (error) {
        notifyError('Parcel search failed', error instanceof Error ? error.message : 'Try again.');
      }
    },
    [companyId, withAuth],
  );

  const submit = useCallback(
    async (input: {
      discrepancyType: DiscrepancyType;
      parcel: ParcelSearchRow | null;
      trackingCode: string;
      bookingCode: string;
      notes: string;
      photo: DiscrepancyPhoto;
    }) => {
      setSaving(true);
      try {
        const record = await withAuth((token) =>
          logReceiveDiscrepancy(token, { ...input, companyId, branchId, actorUserId }),
        );
        try {
          await withAuth((token) =>
            uploadDiscrepancyPhoto(token, {
              id: record.id,
              fileName: input.photo.fileName,
              dataUrl: input.photo.dataUrl,
            }),
          );
          notifySuccess('Discrepancy and photo evidence were recorded.', 'Discrepancy logged');
        } catch (uploadError) {
          setPendingEvidence({ id: record.id, photo: input.photo });
          notifyWarning(
            `Discrepancy was saved, but the photo upload failed: ${uploadError instanceof Error ? uploadError.message : 'retry from the discrepancy record.'}`,
            'Photo upload failed',
          );
        }
        setMatches([]);
        await load();
        return true;
      } catch (error) {
        notifyError(
          'Discrepancy not logged',
          error instanceof Error ? error.message : 'Try again.',
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [actorUserId, branchId, companyId, load, withAuth],
  );

  const retryEvidence = useCallback(async () => {
    if (!pendingEvidence) return;
    setSaving(true);
    try {
      await withAuth((token) =>
        uploadDiscrepancyPhoto(token, {
          id: pendingEvidence.id,
          fileName: pendingEvidence.photo.fileName,
          dataUrl: pendingEvidence.photo.dataUrl,
        }),
      );
      setPendingEvidence(null);
      notifySuccess('The captured photo is now linked to the discrepancy.', 'Evidence uploaded');
    } catch (error) {
      notifyError('Evidence upload failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [pendingEvidence, withAuth]);

  return {
    openItems,
    matches,
    pendingEvidence,
    loading,
    saving,
    load,
    searchParcels,
    submit,
    retryEvidence,
  };
}
