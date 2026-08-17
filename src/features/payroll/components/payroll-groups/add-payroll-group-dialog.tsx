import { useState, type FormEvent } from 'react';
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
import { useCreatePayrollGroupMutation } from '../../api/payroll.api';

export function AddPayrollGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('GHS');
  const [createGroup, { isLoading }] = useCreatePayrollGroupMutation();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await createGroup({
      name: name.trim(),
      payFrequency: 0,
      currencyCode: currency.trim() || 'GHS',
    }).unwrap();
    setName('');
    setCurrency('GHS');
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add payroll group</DialogTitle>
            <DialogDescription>
              Create a group for employees sharing a payroll schedule.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="payroll-group-name">Group name</FieldLabel>
              <Input
                id="payroll-group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="payroll-group-currency">Currency</FieldLabel>
              <Input
                id="payroll-group-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Adding...' : 'Add payroll group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
