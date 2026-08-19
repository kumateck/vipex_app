import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { FileUploadField } from '@/features/uploads/components/file-upload-field';
import type { SenderCashierParcel } from '../../api/parcel.api';
import { RECON_CASE_TYPE_OPTIONS } from './constants';
import { getReconciliationActionOptions } from './utils';

type RequestReconciliationCaseDialogProps = {
  parcel: SenderCashierParcel | null;
  caseType: number;
  actionType: number;
  linkedParcelId: string;
  evidenceUrl: string;
  evidenceFiles: File[];
  notes: string;
  isSubmitting: boolean;
  isUploadingEvidence: boolean;
  onCaseTypeChange: (value: number) => void;
  onActionTypeChange: (value: number) => void;
  onLinkedParcelIdChange: (value: string) => void;
  onEvidenceUrlChange: (value: string) => void;
  onEvidenceFilesChange: (files: File[]) => void;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function RequestReconciliationCaseDialog({
  parcel,
  caseType,
  actionType,
  linkedParcelId,
  evidenceUrl,
  evidenceFiles,
  notes,
  isSubmitting,
  isUploadingEvidence,
  onCaseTypeChange,
  onActionTypeChange,
  onLinkedParcelIdChange,
  onEvidenceUrlChange,
  onEvidenceFilesChange,
  onNotesChange,
  onClose,
  onSubmit,
}: RequestReconciliationCaseDialogProps) {
  return (
    <Dialog
      open={Boolean(parcel)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Parcel Reconciliation Case</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Booking: <strong>{parcel?.bookingCode ?? '-'}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="recon-case-type">Case Type</Label>
            <Select
              value={String(caseType)}
              onValueChange={(value) => onCaseTypeChange(Number(value))}
            >
              <SelectTrigger id="recon-case-type">
                <SelectValue placeholder="Select case type" />
              </SelectTrigger>
              <SelectContent>
                {RECON_CASE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recon-action-type">Proposed Action</Label>
            <Select
              value={String(actionType)}
              onValueChange={(value) => onActionTypeChange(Number(value))}
            >
              <SelectTrigger id="recon-action-type">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                {getReconciliationActionOptions(caseType).map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? (
            <div className="space-y-2">
              <Label htmlFor="recon-linked-parcel">Duplicate Parcel ID</Label>
              <Input
                id="recon-linked-parcel"
                value={linkedParcelId}
                onChange={(event) => onLinkedParcelIdChange(event.target.value)}
                placeholder="Paste duplicate parcel ID"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <FileUploadField
              id="recon-evidence-file"
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
              id="recon-evidence-url"
              value={evidenceUrl}
              onChange={(event) => onEvidenceUrlChange(event.target.value)}
              placeholder="Or paste existing evidence URL"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recon-notes">Reason</Label>
            <Textarea
              id="recon-notes"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              rows={4}
              placeholder="Explain the reconciliation issue"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={isSubmitting || isUploadingEvidence}
          >
            {isSubmitting || isUploadingEvidence ? 'Submitting...' : 'Submit Case'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
