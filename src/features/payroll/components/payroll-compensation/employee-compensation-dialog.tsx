import { type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CompensationItemsEditor } from './compensation-items-editor';
import { EmployeeCompensationFields } from './employee-compensation-fields';
import { useEmployeeCompensationForm } from './hooks/use-employee-compensation-form';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function EmployeeCompensationDialog({ open, onOpenChange }: Props) {
  const form = useEmployeeCompensationForm(() => onOpenChange(false));
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void form.submit();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign employee compensation</DialogTitle>
            <DialogDescription>
              Create or update an employee’s active compensation package.
            </DialogDescription>
          </DialogHeader>
          <EmployeeCompensationFields form={form} />
          <CompensationItemsEditor form={form} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !form.employeeId ||
                !form.groupId ||
                !form.basePay ||
                !form.effectiveFrom ||
                form.isLoading
              }
            >
              {form.isLoading ? 'Saving...' : 'Save compensation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
