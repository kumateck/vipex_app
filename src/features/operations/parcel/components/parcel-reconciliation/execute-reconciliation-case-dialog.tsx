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
import ThrowErrorMessage from '@/lib/throw-error';
import {
  type ParcelReconciliationCaseRow,
  useExecuteParcelReconciliationCaseMutation,
} from '../../api/parcel.api';

type ExecuteReconciliationCaseDialogProps = {
  reconciliationCase: ParcelReconciliationCaseRow | null;
  onClose: () => void;
  onExecuted: () => Promise<unknown> | void;
};

export function ExecuteReconciliationCaseDialog({
  reconciliationCase,
  onClose,
  onExecuted,
}: ExecuteReconciliationCaseDialogProps) {
  const [executeCase, { isLoading: isExecuting }] = useExecuteParcelReconciliationCaseMutation();
  const [executeNote, setExecuteNote] = useState('');

  useEffect(() => {
    if (!reconciliationCase) return;
    setExecuteNote('');
  }, [reconciliationCase]);

  const handleExecute = async () => {
    if (!reconciliationCase) return;

    try {
      await executeCase({
        id: reconciliationCase.id,
        executionNote: executeNote.trim() || null,
      }).unwrap();
      toast.success('Reconciliation case executed');
      onClose();
      await onExecuted();
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return (
    <Dialog open={Boolean(reconciliationCase)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Execute Reconciliation Case</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This action will void active payments and cancel/archive affected parcel records.
          </p>
          <p className="text-sm text-muted-foreground">
            Booking: <strong>{reconciliationCase?.bookingCode ?? '-'}</strong>
          </p>

          <div className="space-y-2">
            <Label htmlFor="execute-note">Execution Note (optional)</Label>
            <Textarea
              id="execute-note"
              rows={3}
              value={executeNote}
              onChange={(event) => setExecuteNote(event.target.value)}
              placeholder="Optional execution note"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleExecute} disabled={isExecuting}>
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
