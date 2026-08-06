import { useState } from 'react';
import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import type { SenderCashierParcel } from '../../api/parcel.api';

export function useReconciliationRequestState() {
  const [reconTargetParcel, setReconTargetParcel] = useState<SenderCashierParcel | null>(null);
  const [reconCaseType, setReconCaseType] = useState<number>(ParcelReconciliationCaseType.SHORTAGE);
  const [reconActionType, setReconActionType] = useState<number>(
    ParcelReconciliationActionType.VOID_AND_REFUND,
  );
  const [reconLinkedParcelId, setReconLinkedParcelId] = useState('');
  const [reconEvidenceUrl, setReconEvidenceUrl] = useState('');
  const [reconEvidenceFiles, setReconEvidenceFiles] = useState<File[]>([]);
  const [reconNotes, setReconNotes] = useState('');

  const openReconciliationCase = (parcel: SenderCashierParcel) => {
    setReconTargetParcel(parcel);
    setReconCaseType(ParcelReconciliationCaseType.SHORTAGE);
    setReconActionType(ParcelReconciliationActionType.VOID_AND_REFUND);
    setReconLinkedParcelId('');
    setReconEvidenceUrl('');
    setReconEvidenceFiles([]);
    setReconNotes('');
  };

  const closeReconciliationCase = () => {
    setReconTargetParcel(null);
    setReconLinkedParcelId('');
    setReconEvidenceUrl('');
    setReconEvidenceFiles([]);
    setReconNotes('');
  };

  const handleReconciliationCaseTypeChange = (nextCaseType: number) => {
    setReconCaseType(nextCaseType);
    if (nextCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
      setReconActionType(ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE);
    } else if (
      reconActionType === ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE ||
      reconActionType === ParcelReconciliationActionType.MERGE_TO_SINGLE
    ) {
      setReconActionType(ParcelReconciliationActionType.VOID_AND_REFUND);
    }
  };

  return {
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
  };
}
