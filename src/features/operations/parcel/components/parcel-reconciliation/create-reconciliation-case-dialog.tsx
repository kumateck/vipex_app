import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import ThrowErrorMessage from '@/lib/throw-error';
import {
  type ParcelSearchRow,
  useLazySearchParcelsQuery,
  useRequestParcelReconciliationCaseMutation,
} from '../../api/parcel.api';
import { CreateReconciliationCaseFields } from './create-reconciliation-case-fields';
import { toDataUrl } from './utils';

type CreateReconciliationCaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
  branchId: string | null;
  onCreated: () => Promise<unknown> | void;
};

export function CreateReconciliationCaseDialog({
  open,
  onOpenChange,
  companyId,
  branchId,
  onCreated,
}: CreateReconciliationCaseDialogProps) {
  const [requestCase, { isLoading: isRequesting }] = useRequestParcelReconciliationCaseMutation();
  const [searchParcels, { isLoading: isSearchingParcels }] = useLazySearchParcelsQuery();
  const [uploadImage, { isLoading: isUploadingEvidence }] = useUploadImageMutation();

  const [createBookingSearch, setCreateBookingSearch] = useState('');
  const [createLinkedBookingSearch, setCreateLinkedBookingSearch] = useState('');
  const [createParcelResults, setCreateParcelResults] = useState<ParcelSearchRow[]>([]);
  const [createLinkedParcelResults, setCreateLinkedParcelResults] = useState<ParcelSearchRow[]>([]);
  const [createSelectedParcelId, setCreateSelectedParcelId] = useState('');
  const [createSelectedLinkedParcelId, setCreateSelectedLinkedParcelId] = useState('');
  const [createCaseType, setCreateCaseType] = useState<number>(
    ParcelReconciliationCaseType.SHORTAGE,
  );
  const [createActionType, setCreateActionType] = useState<number>(
    ParcelReconciliationActionType.VOID_AND_REFUND,
  );
  const [createEvidenceUrl, setCreateEvidenceUrl] = useState('');
  const [createEvidenceFiles, setCreateEvidenceFiles] = useState<File[]>([]);
  const [createNotes, setCreateNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setCreateBookingSearch('');
    setCreateLinkedBookingSearch('');
    setCreateParcelResults([]);
    setCreateLinkedParcelResults([]);
    setCreateSelectedParcelId('');
    setCreateSelectedLinkedParcelId('');
    setCreateCaseType(ParcelReconciliationCaseType.SHORTAGE);
    setCreateActionType(ParcelReconciliationActionType.VOID_AND_REFUND);
    setCreateEvidenceUrl('');
    setCreateEvidenceFiles([]);
    setCreateNotes('');
  }, [open]);

  const selectedCreateParcel = useMemo(
    () => createParcelResults.find((parcel) => parcel.id === createSelectedParcelId) ?? null,
    [createParcelResults, createSelectedParcelId],
  );

  const selectedCreateLinkedParcel = useMemo(
    () =>
      createLinkedParcelResults.find((parcel) => parcel.id === createSelectedLinkedParcelId) ??
      null,
    [createLinkedParcelResults, createSelectedLinkedParcelId],
  );

  useEffect(() => {
    if (!createSelectedParcelId) return;
    setCreateLinkedParcelResults((prev) =>
      prev.filter((parcel) => parcel.id !== createSelectedParcelId),
    );
    setCreateSelectedLinkedParcelId((prev) => (prev === createSelectedParcelId ? '' : prev));
  }, [createSelectedParcelId]);

  const searchParcelsByBooking = async (bookingCode: string) => {
    const booking = bookingCode.trim();
    if (!booking) {
      toast.error('Enter a booking code to search');
      return [];
    }

    try {
      const response = await searchParcels({
        page: 1,
        pageSize: 50,
        search: booking,
        filters: {
          companyId,
          sourceId: branchId,
          includeDeleted: false,
        },
      }).unwrap();
      const matched = response.data.filter((parcel) =>
        parcel.bookingCode.toLowerCase().includes(booking.toLowerCase()),
      );
      if (!matched.length) {
        toast.error('No parcel found for that booking code');
      }
      return matched;
    } catch (error) {
      ThrowErrorMessage(error);
      return [];
    }
  };

  const handleSearchParcelByBooking = async () => {
    const matched = await searchParcelsByBooking(createBookingSearch);
    setCreateParcelResults(matched);
    const [onlyMatch] = matched;
    if (matched.length === 1 && onlyMatch) {
      setCreateSelectedParcelId(onlyMatch.id);
    } else if (!matched.some((parcel) => parcel.id === createSelectedParcelId)) {
      setCreateSelectedParcelId('');
    }
  };

  const handleSearchLinkedParcelByBooking = async () => {
    const matched = await searchParcelsByBooking(createLinkedBookingSearch);
    const filtered = matched.filter((parcel) => parcel.id !== createSelectedParcelId);
    setCreateLinkedParcelResults(filtered);
    const [onlyMatch] = filtered;
    if (filtered.length === 1 && onlyMatch) {
      setCreateSelectedLinkedParcelId(onlyMatch.id);
    } else if (!filtered.some((parcel) => parcel.id === createSelectedLinkedParcelId)) {
      setCreateSelectedLinkedParcelId('');
    }
  };

  const handleCaseTypeChange = (nextCaseType: number) => {
    setCreateCaseType(nextCaseType);
    if (nextCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
      setCreateActionType(ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE);
    } else if (
      createActionType === ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE ||
      createActionType === ParcelReconciliationActionType.MERGE_TO_SINGLE
    ) {
      setCreateActionType(ParcelReconciliationActionType.VOID_AND_REFUND);
    }
    if (nextCaseType !== ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
      setCreateLinkedBookingSearch('');
      setCreateLinkedParcelResults([]);
      setCreateSelectedLinkedParcelId('');
    }
  };

  const handleCreate = async () => {
    const parcelId = createSelectedParcelId.trim();
    const linkedParcelId = createSelectedLinkedParcelId.trim();
    const notes = createNotes.trim();

    if (!parcelId) {
      toast.error('Select a parcel from booking search results');
      return;
    }
    if (createCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY && !linkedParcelId) {
      toast.error('Select the linked duplicate parcel from booking search results');
      return;
    }
    if (!notes) {
      toast.error('Case note is required');
      return;
    }

    try {
      let uploadedEvidenceUrl = createEvidenceUrl.trim() || null;
      const [evidenceFile] = createEvidenceFiles;

      if (evidenceFile) {
        if (!selectedCreateParcel) {
          toast.error('Select the parcel before uploading evidence');
          return;
        }
        const upload = await uploadImage({
          modelType: 'parcel-reconciliation-evidence',
          modelId: selectedCreateParcel.id,
          fileName: evidenceFile.name,
          dataUrl: await toDataUrl(evidenceFile),
        }).unwrap();
        uploadedEvidenceUrl = upload.url;
      }

      await requestCase({
        parcelId,
        linkedParcelId:
          createCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? linkedParcelId : null,
        caseType: createCaseType,
        actionType: createActionType,
        notes,
        evidenceUrl: uploadedEvidenceUrl,
      }).unwrap();
      toast.success('Reconciliation case created');
      onOpenChange(false);
      await onCreated();
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Reconciliation Case</DialogTitle>
        </DialogHeader>

        <CreateReconciliationCaseFields
          bookingSearch={createBookingSearch}
          onBookingSearchChange={setCreateBookingSearch}
          onSearchBooking={handleSearchParcelByBooking}
          isSearchingParcels={isSearchingParcels}
          parcelResults={createParcelResults}
          selectedParcelId={createSelectedParcelId}
          onSelectedParcelIdChange={setCreateSelectedParcelId}
          selectedParcel={selectedCreateParcel}
          caseType={createCaseType}
          onCaseTypeChange={handleCaseTypeChange}
          actionType={createActionType}
          onActionTypeChange={setCreateActionType}
          linkedBookingSearch={createLinkedBookingSearch}
          onLinkedBookingSearchChange={setCreateLinkedBookingSearch}
          onSearchLinkedBooking={handleSearchLinkedParcelByBooking}
          linkedParcelResults={createLinkedParcelResults}
          selectedLinkedParcelId={createSelectedLinkedParcelId}
          onSelectedLinkedParcelIdChange={setCreateSelectedLinkedParcelId}
          selectedLinkedParcel={selectedCreateLinkedParcel}
          evidenceFiles={createEvidenceFiles}
          onEvidenceFilesChange={setCreateEvidenceFiles}
          isUploadingEvidence={isUploadingEvidence}
          evidenceUrl={createEvidenceUrl}
          onEvidenceUrlChange={setCreateEvidenceUrl}
          notes={createNotes}
          onNotesChange={setCreateNotes}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isRequesting || isUploadingEvidence}>
            {isRequesting || isUploadingEvidence ? 'Submitting...' : 'Submit Case'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
