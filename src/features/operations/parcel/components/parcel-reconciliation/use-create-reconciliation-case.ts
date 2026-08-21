import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import ThrowErrorMessage from '@/lib/throw-error';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import {
  type ParcelSearchRow,
  useGetEligibleParcelCorrectionSessionsQuery,
  useLazySearchParcelsQuery,
  useRequestParcelReconciliationCaseMutation,
} from '../../api/parcel.api';
import { getDefaultActionTypeForCaseType, toDataUrl } from './utils';

type UseCreateReconciliationCaseInput = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
  branchId: string | null;
  onCreated: () => Promise<unknown> | void;
};

const DEFAULT_CASE_TYPE = ParcelReconciliationCaseType.SHORTAGE;

export function useCreateReconciliationCase({
  open,
  onOpenChange,
  companyId,
  branchId,
  onCreated,
}: UseCreateReconciliationCaseInput) {
  const [requestCase, requestState] = useRequestParcelReconciliationCaseMutation();
  const [searchParcels, searchState] = useLazySearchParcelsQuery();
  const [uploadImage, uploadState] = useUploadImageMutation();
  const [bookingSearch, setBookingSearch] = useState('');
  const [linkedBookingSearch, setLinkedBookingSearch] = useState('');
  const [parcelResults, setParcelResults] = useState<ParcelSearchRow[]>([]);
  const [linkedParcelResults, setLinkedParcelResults] = useState<ParcelSearchRow[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState('');
  const [selectedLinkedParcelId, setSelectedLinkedParcelId] = useState('');
  const [caseType, setCaseType] = useState<number>(DEFAULT_CASE_TYPE);
  const [actionType, setActionType] = useState<number>(
    getDefaultActionTypeForCaseType(DEFAULT_CASE_TYPE),
  );
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [correctedChargeCedis, setCorrectedChargeCedis] = useState('');
  const [correctedPlannedToBePaidCedis, setCorrectedPlannedToBePaidCedis] = useState('');

  const selectedParcel = useMemo(
    () => parcelResults.find((parcel) => parcel.id === selectedParcelId) ?? null,
    [parcelResults, selectedParcelId],
  );
  const selectedLinkedParcel = useMemo(
    () => linkedParcelResults.find((parcel) => parcel.id === selectedLinkedParcelId) ?? null,
    [linkedParcelResults, selectedLinkedParcelId],
  );
  const isAmountCorrection =
    actionType === ParcelReconciliationActionType.CORRECT_AMOUNT_IN_ORIGINAL_SESSION;
  const sessionsQuery = useGetEligibleParcelCorrectionSessionsQuery(selectedParcelId, {
    skip: !selectedParcelId || !isAmountCorrection,
  });
  const correctionSessions = sessionsQuery.data ?? [];

  useEffect(() => {
    if (!open) return;
    setBookingSearch('');
    setLinkedBookingSearch('');
    setParcelResults([]);
    setLinkedParcelResults([]);
    setSelectedParcelId('');
    setSelectedLinkedParcelId('');
    setCaseType(DEFAULT_CASE_TYPE);
    setActionType(getDefaultActionTypeForCaseType(DEFAULT_CASE_TYPE));
    setEvidenceUrl('');
    setEvidenceFiles([]);
    setNotes('');
    setSelectedSessionId('');
    setCorrectedChargeCedis('');
    setCorrectedPlannedToBePaidCedis('');
  }, [open]);

  useEffect(() => {
    if (!selectedParcel || !isAmountCorrection) return;
    setCorrectedChargeCedis((selectedParcel.chargePsw / 100).toFixed(2));
    setCorrectedPlannedToBePaidCedis((selectedParcel.plannedToBePaidPsw / 100).toFixed(2));
    setSelectedSessionId('');
  }, [isAmountCorrection, selectedParcel]);

  useEffect(() => {
    if (!isAmountCorrection || correctionSessions.length === 0) return;
    const preferred = correctionSessions.find(
      (session) => session.id === selectedParcel?.cashierSessionId,
    );
    setSelectedSessionId((current) =>
      correctionSessions.some((session) => session.id === current)
        ? current
        : (preferred?.id ?? correctionSessions[0]?.id ?? ''),
    );
  }, [correctionSessions, isAmountCorrection, selectedParcel?.cashierSessionId]);

  useEffect(() => {
    if (!selectedParcelId) return;
    setLinkedParcelResults((current) => current.filter((parcel) => parcel.id !== selectedParcelId));
    setSelectedLinkedParcelId((current) => (current === selectedParcelId ? '' : current));
  }, [selectedParcelId]);

  const searchByBooking = async (value: string) => {
    const search = value.trim();
    if (!search) {
      toast.error('Enter a booking code, tracking code, or telephone number to search');
      return [];
    }
    try {
      const response = await searchParcels({
        page: 1,
        pageSize: 50,
        search,
        filters: { companyId, sourceId: branchId, includeDeleted: false },
      }).unwrap();
      if (!response.data.length) toast.error('No matching parcel found');
      return response.data;
    } catch (error) {
      ThrowErrorMessage(error);
      return [];
    }
  };

  const handleSearchParcel = async () => {
    const matches = await searchByBooking(bookingSearch);
    setParcelResults(matches);
    setSelectedParcelId((current) =>
      matches.length === 1
        ? (matches[0]?.id ?? '')
        : matches.some(({ id }) => id === current)
          ? current
          : '',
    );
  };

  const handleSearchLinkedParcel = async () => {
    const matches = (await searchByBooking(linkedBookingSearch)).filter(
      (parcel) => parcel.id !== selectedParcelId,
    );
    setLinkedParcelResults(matches);
    setSelectedLinkedParcelId((current) =>
      matches.length === 1
        ? (matches[0]?.id ?? '')
        : matches.some(({ id }) => id === current)
          ? current
          : '',
    );
  };

  const handleCaseTypeChange = (nextCaseType: number) => {
    setCaseType(nextCaseType);
    setActionType(getDefaultActionTypeForCaseType(nextCaseType));
    if (nextCaseType !== ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
      setLinkedBookingSearch('');
      setLinkedParcelResults([]);
      setSelectedLinkedParcelId('');
    }
  };

  const validateCorrection = () => {
    if (!isAmountCorrection) return true;
    if (!selectedSessionId) {
      toast.error('Select the original cashier session');
      return false;
    }
    if (!correctedChargeCedis.trim() || !correctedPlannedToBePaidCedis.trim()) {
      toast.error('Enter both corrected amounts');
      return false;
    }
    const error = getParcelChargeValidationError({
      chargeCedis: Number(correctedChargeCedis),
      plannedToBePaidCedis: Number(correctedPlannedToBePaidCedis),
    });
    if (error) toast.error(error);
    if (error) return false;
    if (
      selectedParcel &&
      Number(correctedChargeCedis) === selectedParcel.chargePsw / 100 &&
      Number(correctedPlannedToBePaidCedis) === selectedParcel.plannedToBePaidPsw / 100
    ) {
      toast.error('Change at least one amount before submitting the correction');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    const linkedParcelId = selectedLinkedParcelId.trim();
    const trimmedNotes = notes.trim();
    if (!selectedParcelId) return toast.error('Select a parcel from the search results');
    if (caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY && !linkedParcelId) {
      return toast.error('Select the linked duplicate parcel');
    }
    if (!trimmedNotes) return toast.error('Case note is required');
    if (!validateCorrection()) return;

    try {
      let uploadedEvidenceUrl = evidenceUrl.trim() || null;
      const [evidenceFile] = evidenceFiles;
      if (evidenceFile && selectedParcel) {
        const upload = await uploadImage({
          modelType: 'parcel-reconciliation-evidence',
          modelId: selectedParcel.id,
          fileName: evidenceFile.name,
          dataUrl: await toDataUrl(evidenceFile),
        }).unwrap();
        uploadedEvidenceUrl = upload.url;
      }
      await requestCase({
        parcelId: selectedParcelId,
        linkedParcelId:
          caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? linkedParcelId : null,
        caseType,
        actionType,
        notes: trimmedNotes,
        evidenceUrl: uploadedEvidenceUrl,
        cashierSessionId: isAmountCorrection ? selectedSessionId : null,
        correctedChargeCedis: isAmountCorrection ? correctedChargeCedis : null,
        correctedPlannedToBePaidCedis: isAmountCorrection ? correctedPlannedToBePaidCedis : null,
      }).unwrap();
      toast.success('Reconciliation case created for independent approval');
      onOpenChange(false);
      await onCreated();
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return {
    fields: {
      bookingSearch,
      onBookingSearchChange: setBookingSearch,
      onSearchBooking: handleSearchParcel,
      isSearchingParcels: searchState.isLoading,
      parcelResults,
      selectedParcelId,
      onSelectedParcelIdChange: setSelectedParcelId,
      selectedParcel,
      caseType,
      onCaseTypeChange: handleCaseTypeChange,
      actionType,
      onActionTypeChange: setActionType,
      linkedBookingSearch,
      onLinkedBookingSearchChange: setLinkedBookingSearch,
      onSearchLinkedBooking: handleSearchLinkedParcel,
      linkedParcelResults,
      selectedLinkedParcelId,
      onSelectedLinkedParcelIdChange: setSelectedLinkedParcelId,
      selectedLinkedParcel,
      evidenceFiles,
      onEvidenceFilesChange: setEvidenceFiles,
      isUploadingEvidence: uploadState.isLoading,
      evidenceUrl,
      onEvidenceUrlChange: setEvidenceUrl,
      notes,
      onNotesChange: setNotes,
      correctionSessions,
      selectedSessionId,
      onSelectedSessionIdChange: setSelectedSessionId,
      correctedChargeCedis,
      onCorrectedChargeCedisChange: setCorrectedChargeCedis,
      correctedPlannedToBePaidCedis,
      onCorrectedPlannedToBePaidCedisChange: setCorrectedPlannedToBePaidCedis,
      isLoadingCorrectionSessions: sessionsQuery.isFetching,
    },
    handleCreate,
    isSubmitting: requestState.isLoading || uploadState.isLoading,
  };
}
