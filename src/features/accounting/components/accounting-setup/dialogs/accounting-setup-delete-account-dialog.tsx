import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

type AccountingSetupDeleteAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  removeLinkedCategoryOnDelete: boolean;
  onRemoveLinkedCategoryOnDeleteChange: (removeLinkedCategoryOnDelete: boolean) => void;
  isDeletingAccount: boolean;
  canDeleteAccount: boolean;
  onDeleteAccount: () => void;
};

export function AccountingSetupDeleteAccountDialog({
  open,
  onOpenChange,
  removeLinkedCategoryOnDelete,
  onRemoveLinkedCategoryOnDeleteChange,
  isDeletingAccount,
  canDeleteAccount,
  onDeleteAccount,
}: AccountingSetupDeleteAccountDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete ledger account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the selected account. The delete will only succeed when the
            account has no journal transactions, setup mappings, petty cash links, or child
            accounts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-md border p-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <Checkbox
              checked={removeLinkedCategoryOnDelete}
              onCheckedChange={(checked) => onRemoveLinkedCategoryOnDeleteChange(checked === true)}
            />
            <span className="text-muted-foreground">
              Also delete the linked expense category (only possible when that category has no
              expense requests).
            </span>
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeletingAccount || !canDeleteAccount}
            onClick={onDeleteAccount}
          >
            {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
