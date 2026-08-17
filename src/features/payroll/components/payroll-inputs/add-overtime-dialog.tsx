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
import { useOvertimeForm } from './hooks/use-overtime-form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollCycleId: string;
};

export function AddOvertimeDialog({ open, onOpenChange, payrollCycleId }: Props) {
  const form = useOvertimeForm(payrollCycleId, () => onOpenChange(false));
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void form.submit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add overtime</DialogTitle>
            <DialogDescription>
              Add an overtime entry to the selected payroll cycle.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="overtime-employee">Employee</FieldLabel>
              <select
                id="overtime-employee"
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
              <FieldLabel htmlFor="overtime-minutes">Minutes</FieldLabel>
              <Input
                id="overtime-minutes"
                type="number"
                min={1}
                value={form.minutes}
                onChange={(event) => form.setMinutes(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="overtime-rate">Rate per hour (psw)</FieldLabel>
              <Input
                id="overtime-rate"
                type="number"
                min={1}
                value={form.ratePerHourPsw}
                onChange={(event) => form.setRatePerHourPsw(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="overtime-multiplier">Multiplier %</FieldLabel>
              <Input
                id="overtime-multiplier"
                type="number"
                min={1}
                value={form.multiplierPct}
                onChange={(event) => form.setMultiplierPct(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="overtime-notes">Notes (optional)</FieldLabel>
              <Input
                id="overtime-notes"
                value={form.notes}
                onChange={(event) => form.setNotes(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !payrollCycleId ||
                !form.employeeId ||
                !form.minutes ||
                !form.ratePerHourPsw ||
                form.isLoading
              }
            >
              {form.isLoading ? 'Adding...' : 'Add overtime'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
