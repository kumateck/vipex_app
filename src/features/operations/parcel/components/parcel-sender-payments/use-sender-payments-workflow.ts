import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ParcelReconciliationCaseType, ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetLocationQuery } from '@/features/locations/api/locations.api';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import type { PaginationRequestDto } from '@/server/types/pagination.types';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type SenderCashierParcel,
  useCollectSenderAndProcessMutation,
  useListSenderCashierParcelsQuery,
  useRequestParcelReconciliationCaseMutation,
  useSoftDeleteParcelMutation,
} from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt.types';
import { buildSenderReceiptData } from './build-sender-receipt-data';
import { useReconciliationRequestState } from './use-reconciliation-request-state';
import { getSenderDuePsw, toDataUrl } from './utils';

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
    filters: {
      companyId,
      sourceId: branchId,
      status: ParcelStatus.CREATED,
    },
  });

  const [selectedParcel, setSelectedParcel] = useState<SenderCashierParcel | null>(null);
  const [deleteTargetParcel, setDeleteTargetParcel] = useState<SenderCashierParcel | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [lastPrintedReceipt, setLastPrintedReceipt] = useState<ReceiptPrintData | null>(null);
  const {
    reconTargetParcel,
    reconCaseType,
    reconActionType,
    reconLinkedParcelId,
    reconEvidenceUrl,
    reconEvidenceFiles,
    reconNotes,
    setReconActionType,
    setReconLinkedParcelId,
    setReconEvidenceUrl,
    setReconEvidenceFiles,
    setReconNotes,
    openReconciliationCase,
    closeReconciliationCase,
    handleReconciliationCaseTypeChange,
  } = useReconciliationRequestState();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethodRaw] = useState<string>(String(PaymentMethod.CASH));
  const [momoTransactionId, setMomoTransactionId] = useState('');

  const setPaymentMethod = (method: string) => {
    setPaymentMethodRaw(method);
    setMomoTransactionId('');
  };

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: pickupLocation } = useGetLocationQuery(selectedParcel?.pickupLocationId ?? '', {
    skip: !selectedParcel?.pickupLocationId,
  });

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: {
        companyId,
        sourceId: branchId,
        status: ParcelStatus.CREATED,
      },
    }));
  }, [branchId, companyId]);

  const { data, isLoading, refetch } = useListSenderCashierParcelsQuery(query, {
    skip: !companyId || !branchId,
  });
  const [collectSenderAndProcess, { isLoading: isCollecting }] =
    useCollectSenderAndProcessMutation();
  const [softDeleteParcel, { isLoading: isDeletingParcel }] = useSoftDeleteParcelMutation();
  const [requestReconciliationCase, { isLoading: isRequestingReconciliation }] =
    useRequestParcelReconciliationCaseMutation();
  const [uploadImage, { isLoading: isUploadingEvidence }] = useUploadImageMutation();

  const openCollectPayment = (parcel: SenderCashierParcel) => {
    setSelectedParcel(parcel);
    setAmount((getSenderDuePsw(parcel) / 100).toFixed(2));
    setPaymentMethod(String(PaymentMethod.CASH));
    setMomoTransactionId('');
  };

  const closeCollectPayment = () => {
    setSelectedParcel(null);
    setMomoTransactionId('');
  };

  const openDeleteParcel = (parcel: SenderCashierParcel) => {
    setDeleteTargetParcel(parcel);
    setDeleteReason('');
  };

  const closeDeleteParcel = () => {
    setDeleteTargetParcel(null);
    setDeleteReason('');
  };

  const handleCollectPayment = async () => {
    if (!selectedParcel) return;

    const senderDueCedis = getSenderDuePsw(selectedParcel) / 100;
    const amountValue = Number(amount);
    const totalCharge = selectedParcel.chargePsw / 100;
    const receiverToPayCedis = Math.max(totalCharge - senderDueCedis, 0);

    let payment:
      | {
          amounts: {
            vatCedis: number;
            getfundCedis: number;
            nhilCedis: number;
            covidCedis: number;
            taxTotalCedis: number;
          };
        }
      | undefined;

    try {
      if (senderDueCedis > 0) {
        if (Number.isNaN(amountValue) || amountValue <= 0) {
          toast.error('Enter a valid payment amount');
          return;
        }
        if (Math.abs(amountValue - senderDueCedis) > 0.00001) {
          toast.error(
            `Sender cashier can only collect GHS ${senderDueCedis.toFixed(2)} for this parcel`,
          );
          return;
        }

        const result = await collectSenderAndProcess({
          parcelId: selectedParcel.id,
          amountCedis: amountValue,
          method: Number(paymentMethod),
          momoTransactionId: momoTransactionId || null,
        }).unwrap();
        payment = result.payment ?? undefined;
      } else {
        await collectSenderAndProcess({
          parcelId: selectedParcel.id,
          amountCedis: null,
          method: Number(paymentMethod),
        }).unwrap();
      }

      const destinationBranchName =
        branchOptions.find((branch) => branch.id === selectedParcel.destinationId)?.name ??
        selectedParcel.destinationId;
      const destinationLocationName =
        pickupLocation?.name ?? selectedParcel.pickupLocationId ?? '-';
      setLastPrintedReceipt(
        buildSenderReceiptData({
          parcel: selectedParcel,
          senderDueCedis,
          amountValue,
          totalChargeCedis: totalCharge,
          receiverToPayCedis,
          destinationBranchName,
          destinationLocationName,
          taxBreakdown: payment ? payment.amounts : undefined,
        }),
      );

      toast.success(
        senderDueCedis > 0 ? 'Payment collected successfully' : 'Receipts generated successfully',
      );
      setSelectedParcel(null);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process parcel');
    }
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
      if (selectedParcel?.id === deleteTargetParcel.id) {
        setSelectedParcel(null);
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete parcel');
    }
  };

  const handleRequestReconciliation = async () => {
    if (!reconTargetParcel) return;
    const notes = reconNotes.trim();
    const linkedParcelId = reconLinkedParcelId.trim();
    if (!notes) {
      toast.error('Reconciliation note is required');
      return;
    }
    if (reconCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY && !linkedParcelId) {
      toast.error('Duplicate parcel ID is required for duplicate entry cases');
      return;
    }

    try {
      let uploadedEvidenceUrl = reconEvidenceUrl.trim() || null;
      const [evidenceFile] = reconEvidenceFiles;
      if (evidenceFile) {
        const upload = await uploadImage({
          modelType: 'parcel-reconciliation-evidence',
          modelId: reconTargetParcel.id,
          fileName: evidenceFile.name,
          dataUrl: await toDataUrl(evidenceFile),
        }).unwrap();
        uploadedEvidenceUrl = upload.url;
      }

      await requestReconciliationCase({
        parcelId: reconTargetParcel.id,
        caseType: reconCaseType,
        actionType: reconActionType,
        linkedParcelId:
          reconCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? linkedParcelId : null,
        notes,
        evidenceUrl: uploadedEvidenceUrl,
      }).unwrap();
      toast.success('Reconciliation case created');
      closeReconciliationCase();
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create reconciliation case');
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
    selectedParcel,
    closeCollectPayment,
    amount,
    setAmount,
    paymentMethod,
    setPaymentMethod,
    momoTransactionId,
    setMomoTransactionId,
    isSubmitting: isCollecting,
    handleCollectPayment,
    deleteTargetParcel,
    deleteReason,
    setDeleteReason,
    isDeletingParcel,
    closeDeleteParcel,
    handleDeleteParcel,
    reconTargetParcel,
    reconCaseType,
    reconActionType,
    reconLinkedParcelId,
    reconEvidenceUrl,
    reconEvidenceFiles,
    reconNotes,
    isRequestingReconciliation,
    isUploadingEvidence,
    handleReconciliationCaseTypeChange,
    setReconActionType,
    setReconLinkedParcelId,
    setReconEvidenceUrl,
    setReconEvidenceFiles,
    setReconNotes,
    closeReconciliationCase,
    handleRequestReconciliation,
    openCollectPayment,
    openDeleteParcel,
    openReconciliationCase,
    pickupLocationName: pickupLocation?.name ?? '',
    lastPrintedReceipt,
    clearLastPrintedReceipt: () => setLastPrintedReceipt(null),
  };
}
