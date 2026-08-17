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
import { useCreateDeductionTypeMutation } from '../../api/payroll.api';
export function DeductionTypeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [createType, { isLoading }] = useCreateDeductionTypeMutation();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim() || !name.trim()) return;
    await createType({ code: code.trim(), name: name.trim() }).unwrap();
    setCode('');
    setName('');
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add deduction type</DialogTitle>
            <DialogDescription>Create a reusable payroll deduction category.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="deduction-code">Code</FieldLabel>
              <Input
                id="deduction-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="deduction-name">Name</FieldLabel>
              <Input
                id="deduction-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!code.trim() || !name.trim() || isLoading}>
              {isLoading ? 'Adding...' : 'Add deduction type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
