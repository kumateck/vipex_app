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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PayrollItemType } from '@/db/schemas/enums';
import { useManualAdjustmentForm } from './hooks/use-manual-adjustment-form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollCycleId: string;
};

export function AddManualAdjustmentDialog({ open, onOpenChange, payrollCycleId }: Props) {
  const form = useManualAdjustmentForm(payrollCycleId, () => onOpenChange(false));
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void form.submit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add manual adjustment</DialogTitle>
            <DialogDescription>
              Add a one-time earning or deduction to the selected payroll cycle.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="adjustment-employee">Employee</FieldLabel>
              <select
                id="adjustment-employee"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={form.employeeId}
                onChange={(event) => form.setEmployeeId(event.target.value)}
              >
                <option value="">Select employee</option>
                {form.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.displayName} ({employee.employeeNumber})
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="adjustment-kind">Adjustment kind</FieldLabel>
              <select
                id="adjustment-kind"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={form.itemType}
                onChange={(event) => form.changeItemType(event.target.value)}
              >
                <option value={String(PayrollItemType.EARNING)}>Earning</option>
                <option value={String(PayrollItemType.DEDUCTION)}>Deduction</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="adjustment-type">Type</FieldLabel>
              <select
                id="adjustment-type"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={form.typeId}
                onChange={(event) => form.setTypeId(event.target.value)}
              >
                <option value="">Select type</option>
                {form.availableTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.code} - {type.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="adjustment-amount">Amount (psw)</FieldLabel>
              <Input
                id="adjustment-amount"
                type="number"
                min={1}
                value={form.amountPsw}
                onChange={(event) => form.setAmountPsw(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="adjustment-notes">Notes (optional)</FieldLabel>
              <Input
                id="adjustment-notes"
                value={form.notes}
                onChange={(event) => form.setNotes(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isTaxable}
              disabled={Number(form.itemType) === PayrollItemType.DEDUCTION}
              onChange={(event) => form.setIsTaxable(event.target.checked)}
            />
            Taxable earning
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !payrollCycleId ||
                !form.employeeId ||
                !form.typeId ||
                !form.amountPsw ||
                form.isLoading
              }
            >
              {form.isLoading ? 'Adding...' : 'Add adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
