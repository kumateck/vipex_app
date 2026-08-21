import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateReconciliationCaseFields } from './create-reconciliation-case-fields';
import { useCreateReconciliationCase } from './use-create-reconciliation-case';

type CreateReconciliationCaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
  branchId: string | null;
  onCreated: () => Promise<unknown> | void;
};

export function CreateReconciliationCaseDialog(props: CreateReconciliationCaseDialogProps) {
  const workflow = useCreateReconciliationCase(props);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Reconciliation Case</DialogTitle>
        </DialogHeader>

        <CreateReconciliationCaseFields {...workflow.fields} />

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={workflow.handleCreate} disabled={workflow.isSubmitting}>
            {workflow.isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
