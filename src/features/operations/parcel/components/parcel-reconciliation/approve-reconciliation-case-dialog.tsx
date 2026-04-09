import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ParcelReconciliationActionType } from '@/db/schemas/enums';
import ThrowErrorMessage from '@/lib/throw-error';
import {
  type ParcelReconciliationCaseRow,
  useApproveParcelReconciliationCaseMutation,
} from '../../api/parcel.api';
import { ReconciliationActionSelect } from './reconciliation-action-select';
import { getDefaultActionTypeForCaseType } from './utils';

type ApproveReconciliationCaseDialogProps = {
  reconciliationCase: ParcelReconciliationCaseRow | null;
  onClose: () => void;
  onApproved: () => Promise<unknown> | void;
};

export function ApproveReconciliationCaseDialog({
  reconciliationCase,
  onClose,
  onApproved,
}: ApproveReconciliationCaseDialogProps) {
  const [approveCase, { isLoading: isApproving }] = useApproveParcelReconciliationCaseMutation();
  const [approveActionType, setApproveActionType] = useState<number>(
    ParcelReconciliationActionType.VOID_AND_REFUND,
  );
  const [approveNote, setApproveNote] = useState('');

  useEffect(() => {
    if (!reconciliationCase) return;
    setApproveActionType(getDefaultActionTypeForCaseType(reconciliationCase.caseType));
    setApproveNote('');
  }, [reconciliationCase]);

  const handleApprove = async () => {
    if (!reconciliationCase) return;

    try {
      await approveCase({
        id: reconciliationCase.id,
        actionType: approveActionType,
        resolutionNote: approveNote.trim() || null,
      }).unwrap();
      toast.success('Reconciliation case approved');
      onClose();
      await onApproved();
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return (
    <Dialog open={Boolean(reconciliationCase)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Reconciliation Case</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tracking: <strong>{reconciliationCase?.trackingCode ?? '-'}</strong>
          </p>

          <ReconciliationActionSelect
            id="approve-action-type"
            label="Action"
            value={approveActionType}
            caseType={reconciliationCase?.caseType ?? 0}
            placeholder="Select action"
            onValueChange={setApproveActionType}
          />

          <div className="space-y-2">
            <Label htmlFor="approve-note">Approval Note (optional)</Label>
            <Textarea
              id="approve-note"
              rows={3}
              value={approveNote}
              onChange={(event) => setApproveNote(event.target.value)}
              placeholder="Optional approval note"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isApproving}>
            {isApproving ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
