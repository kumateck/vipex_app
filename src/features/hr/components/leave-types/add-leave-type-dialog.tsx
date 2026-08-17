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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateLeaveTypeMutation } from '../../api/hr.api';

export function AddLeaveTypeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [paid, setPaid] = useState('true');
  const [advanceDays, setAdvanceDays] = useState('0');
  const [sameDay, setSameDay] = useState('true');
  const [createLeaveType, { isLoading }] = useCreateLeaveTypeMutation();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await createLeaveType({
      code: code.trim() || null,
      name: name.trim(),
      isPaid: paid === 'true',
      minAdvanceDays: Math.max(0, Number(advanceDays) || 0),
      allowEmergencySameDay: sameDay === 'true',
    }).unwrap();
    setCode('');
    setName('');
    setPaid('true');
    setAdvanceDays('0');
    setSameDay('true');
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add leave type</DialogTitle>
            <DialogDescription>Configure a leave category and its request rules.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="leave-code">Code</FieldLabel>
              <Input id="leave-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="leave-name">Name</FieldLabel>
              <Input
                id="leave-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Payment</FieldLabel>
              <Select value={paid} onValueChange={setPaid}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Paid</SelectItem>
                  <SelectItem value="false">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="leave-advance">Minimum advance days</FieldLabel>
              <Input
                id="leave-advance"
                type="number"
                min={0}
                value={advanceDays}
                onChange={(e) => setAdvanceDays(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Emergency same-day requests</FieldLabel>
              <Select value={sameDay} onValueChange={setSameDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Allowed</SelectItem>
                  <SelectItem value="false">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Adding...' : 'Add leave type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
