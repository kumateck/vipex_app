import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ParcelReconciliationCaseType, ParcelStatus } from '@/db/schemas/enums';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import type { PaginationRequestDto } from '@/server/types/pagination.types';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type SenderCashierParcel,
  useListSenderCashierParcelsQuery,
  useRequestParcelReconciliationCaseMutation,
  useSoftDeleteParcelMutation,
} from '../../api/parcel.api';
import { SENDER_PAYMENTS_DEFAULT_SORT } from './constants';
import { useReconciliationRequestState } from './use-reconciliation-request-state';
import { useSenderPaymentCollection } from './use-sender-payment-collection';
import { toDataUrl } from './utils';

type SenderPaymentsQuery = PaginationRequestDto<{
  companyId?: string | null;
  sourceId?: string | null;
  status?: number | null;
}>;

export function useSenderPaymentsWorkflow() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const canDeleteParcel = (user?.permissions ?? []).includes(
    PermissionKeys.CanSoftDeleteParcelsAndPayments,
  );
  const canRequestReconciliation = (user?.permissions ?? []).includes(
    PermissionKeys.CanRequestParcelReconciliation,
  );
  const [query, setQuery] = useState<SenderPaymentsQuery>({
    page: 1,
    pageSize: 20,
    sort: SENDER_PAYMENTS_DEFAULT_SORT,
    filters: { companyId, sourceId: branchId, status: ParcelStatus.CREATED },
  });
  const [deleteTargetParcel, setDeleteTargetParcel] = useState<SenderCashierParcel | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const reconciliation = useReconciliationRequestState();

  useEffect(() => {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      sort: SENDER_PAYMENTS_DEFAULT_SORT,
      filters: { companyId, sourceId: branchId, status: ParcelStatus.CREATED },
    }));
  }, [branchId, companyId]);

  const { data, isLoading, refetch } = useListSenderCashierParcelsQuery(query, {
    skip: !companyId || !branchId,
  });
  const [softDeleteParcel, { isLoading: isDeletingParcel }] = useSoftDeleteParcelMutation();
  const [requestReconciliationCase, { isLoading: isRequestingReconciliation }] =
    useRequestParcelReconciliationCaseMutation();
  const [uploadImage, { isLoading: isUploadingEvidence }] = useUploadImageMutation();
  const collection = useSenderPaymentCollection({ companyId, refetch });

  const openDeleteParcel = (parcel: SenderCashierParcel) => {
    setDeleteTargetParcel(parcel);
    setDeleteReason('');
  };

  const closeDeleteParcel = () => {
    setDeleteTargetParcel(null);
    setDeleteReason('');
  };

  const handleDeleteParcel = async () => {
    if (!deleteTargetParcel) return;
    const reason = deleteReason.trim();
    if (!reason) {
      toast.error('Deletion reason is required');
      return;
    }

    try {
      const result = await softDeleteParcel({ id: deleteTargetParcel.id, reason }).unwrap();
      toast.success(
        `Parcel deleted. Payments voided ${result.payments.totalVoided}/${result.payments.total}.`,
      );
      closeDeleteParcel();
      if (collection.selectedParcel?.id === deleteTargetParcel.id) {
        collection.closeCollectPayment();
      }
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to delete parcel');
    }
  };

  const handleRequestReconciliation = async () => {
    if (!reconciliation.reconTargetParcel) return;
    const notes = reconciliation.reconNotes.trim();
    const linkedParcelId = reconciliation.reconLinkedParcelId.trim();
    if (!notes) {
      toast.error('Reconciliation note is required');
      return;
    }
    if (
      reconciliation.reconCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY &&
      !linkedParcelId
    ) {
      toast.error('Duplicate parcel ID is required for duplicate entry cases');
      return;
    }

    try {
      let uploadedEvidenceUrl = reconciliation.reconEvidenceUrl.trim() || null;
      const [evidenceFile] = reconciliation.reconEvidenceFiles;
      if (evidenceFile) {
        const upload = await uploadImage({
          modelType: 'parcel-reconciliation-evidence',
          modelId: reconciliation.reconTargetParcel.id,
          fileName: evidenceFile.name,
          dataUrl: await toDataUrl(evidenceFile),
        }).unwrap();
        uploadedEvidenceUrl = upload.url;
      }

      await requestReconciliationCase({
        parcelId: reconciliation.reconTargetParcel.id,
        caseType: reconciliation.reconCaseType,
        actionType: reconciliation.reconActionType,
        linkedParcelId:
          reconciliation.reconCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY
            ? linkedParcelId
            : null,
        notes,
        evidenceUrl: uploadedEvidenceUrl,
      }).unwrap();
      toast.success('Reconciliation case created');
      reconciliation.closeReconciliationCase();
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create reconciliation case');
    }
  };

  return {
    query,
    setQuery,
    companyId,
    branchId,
    canDeleteParcel,
    canRequestReconciliation,
    data,
    isLoading,
    ...collection,
    deleteTargetParcel,
    deleteReason,
    setDeleteReason,
    isDeletingParcel,
    closeDeleteParcel,
    handleDeleteParcel,
    isRequestingReconciliation,
    isUploadingEvidence,
    handleRequestReconciliation,
    openDeleteParcel,
    ...reconciliation,
  };
}
