import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import { ParcelReconciliationCaseType } from '@/db/schemas/enums';
import { ParcelReconciliationActionType } from '@/db/schemas/enums';
import { FileUploadField } from '@/features/uploads/components/file-upload-field';
import type { ParcelCorrectionSession, ParcelSearchRow } from '../../api/parcel.api';
import { AmountCorrectionFields } from './amount-correction-fields';
import { CASE_TYPE_OPTIONS } from './constants';
import { ParcelBookingSearchField } from './parcel-booking-search-field';
import { ParcelSelectionField } from './parcel-selection-field';
import { ReconciliationActionSelect } from './reconciliation-action-select';

type CreateReconciliationCaseFieldsProps = {
  bookingSearch: string;
  onBookingSearchChange: (value: string) => void;
  onSearchBooking: () => void;
  isSearchingParcels: boolean;
  parcelResults: ParcelSearchRow[];
  selectedParcelId: string;
  onSelectedParcelIdChange: (value: string) => void;
  selectedParcel: ParcelSearchRow | null;
  caseType: number;
  onCaseTypeChange: (value: number) => void;
  actionType: number;
  onActionTypeChange: (value: number) => void;
  linkedBookingSearch: string;
  onLinkedBookingSearchChange: (value: string) => void;
  onSearchLinkedBooking: () => void;
  linkedParcelResults: ParcelSearchRow[];
  selectedLinkedParcelId: string;
  onSelectedLinkedParcelIdChange: (value: string) => void;
  selectedLinkedParcel: ParcelSearchRow | null;
  evidenceFiles: File[];
  onEvidenceFilesChange: (files: File[]) => void;
  isUploadingEvidence: boolean;
  evidenceUrl: string;
  onEvidenceUrlChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  correctionSessions: ParcelCorrectionSession[];
  selectedSessionId: string;
  onSelectedSessionIdChange: (value: string) => void;
  correctedChargeCedis: string;
  onCorrectedChargeCedisChange: (value: string) => void;
  correctedPlannedToBePaidCedis: string;
  onCorrectedPlannedToBePaidCedisChange: (value: string) => void;
  isLoadingCorrectionSessions: boolean;
};

export function CreateReconciliationCaseFields({
  bookingSearch,
  onBookingSearchChange,
  onSearchBooking,
  isSearchingParcels,
  parcelResults,
  selectedParcelId,
  onSelectedParcelIdChange,
  selectedParcel,
  caseType,
  onCaseTypeChange,
  actionType,
  onActionTypeChange,
  linkedBookingSearch,
  onLinkedBookingSearchChange,
  onSearchLinkedBooking,
  linkedParcelResults,
  selectedLinkedParcelId,
  onSelectedLinkedParcelIdChange,
  selectedLinkedParcel,
  evidenceFiles,
  onEvidenceFilesChange,
  isUploadingEvidence,
  evidenceUrl,
  onEvidenceUrlChange,
  notes,
  onNotesChange,
  correctionSessions,
  selectedSessionId,
  onSelectedSessionIdChange,
  correctedChargeCedis,
  onCorrectedChargeCedisChange,
  correctedPlannedToBePaidCedis,
  onCorrectedPlannedToBePaidCedisChange,
  isLoadingCorrectionSessions,
}: CreateReconciliationCaseFieldsProps) {
  return (
    <div className="space-y-3">
      <ParcelBookingSearchField
        id="create-case-booking-search"
        label="Find Transaction"
        placeholder="Booking code, tracking code, or telephone"
        value={bookingSearch}
        onValueChange={onBookingSearchChange}
        onSearch={onSearchBooking}
        isSearching={isSearchingParcels}
      />

      <ParcelSelectionField
        id="create-case-parcel-select"
        label="Select Parcel"
        placeholder="Choose booking/sender from search results"
        selectedParcelId={selectedParcelId}
        onSelectedParcelIdChange={onSelectedParcelIdChange}
        parcels={parcelResults}
        selectedParcel={selectedParcel}
        selectedPrefix="Selected"
      />

      <div className="space-y-2">
        <Label htmlFor="create-case-type">Case Type</Label>
        <Select value={String(caseType)} onValueChange={(value) => onCaseTypeChange(Number(value))}>
          <SelectTrigger id="create-case-type">
            <SelectValue placeholder="Select case type" />
          </SelectTrigger>
          <SelectContent>
            {CASE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ReconciliationActionSelect
        id="create-case-action"
        label="Proposed Action"
        value={actionType}
        caseType={caseType}
        placeholder="Select action"
        onValueChange={onActionTypeChange}
      />

      {actionType === ParcelReconciliationActionType.CORRECT_AMOUNT_IN_ORIGINAL_SESSION ? (
        <AmountCorrectionFields
          selectedParcel={selectedParcel}
          sessions={correctionSessions}
          selectedSessionId={selectedSessionId}
          onSelectedSessionIdChange={onSelectedSessionIdChange}
          correctedChargeCedis={correctedChargeCedis}
          onCorrectedChargeCedisChange={onCorrectedChargeCedisChange}
          correctedPlannedToBePaidCedis={correctedPlannedToBePaidCedis}
          onCorrectedPlannedToBePaidCedisChange={onCorrectedPlannedToBePaidCedisChange}
          isLoadingSessions={isLoadingCorrectionSessions}
        />
      ) : null}

      {caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? (
        <>
          <ParcelBookingSearchField
            id="create-case-linked-booking-search"
            label="Find Linked Duplicate"
            placeholder="Booking code, tracking code, or telephone"
            value={linkedBookingSearch}
            onValueChange={onLinkedBookingSearchChange}
            onSearch={onSearchLinkedBooking}
            isSearching={isSearchingParcels}
          />

          <ParcelSelectionField
            id="create-case-linked-parcel-select"
            label="Select Linked Parcel"
            placeholder="Choose duplicate booking/sender from results"
            selectedParcelId={selectedLinkedParcelId}
            onSelectedParcelIdChange={onSelectedLinkedParcelIdChange}
            parcels={linkedParcelResults}
            selectedParcel={selectedLinkedParcel}
            selectedPrefix="Linked"
          />
        </>
      ) : null}

      <div className="space-y-2">
        <FileUploadField
          id="create-case-evidence-file"
          label="Evidence (optional)"
          files={evidenceFiles}
          onFilesChange={(files) => onEvidenceFilesChange(files.slice(0, 1))}
          accept="image/*,.pdf,.doc,.docx"
          maxFiles={1}
          disabled={isUploadingEvidence}
          title="Drag and drop evidence file, or click to choose"
          helperText="Uploads one file and stores the resulting evidence URL."
        />
        <Input
          id="create-case-evidence"
          value={evidenceUrl}
          onChange={(event) => onEvidenceUrlChange(event.target.value)}
          placeholder="Or paste existing evidence URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="create-case-note">Reason</Label>
        <Textarea
          id="create-case-note"
          rows={4}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Explain the case"
        />
      </div>
    </div>
  );
}
