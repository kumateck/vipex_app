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
} from '@/components/ui/select-searchable';
import { useCreateJobTitleMutation, useListDepartmentOptionsQuery } from '../../api/hr.api';

export function AddJobTitleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [departmentId, setDepartmentId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [leaveDays, setLeaveDays] = useState('0');
  const { data: departments = [] } = useListDepartmentOptionsQuery();
  const [createJobTitle, { isLoading }] = useCreateJobTitleMutation();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !departmentId) return;
    await createJobTitle({
      departmentId,
      code: code.trim() || null,
      name: name.trim(),
      defaultLeaveDays: Math.max(0, Number(leaveDays) || 0),
    }).unwrap();
    setDepartmentId('');
    setCode('');
    setName('');
    setLeaveDays('0');
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add job title</DialogTitle>
            <DialogDescription>Create a job title within a department.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Department</FieldLabel>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="job-title-code">Code</FieldLabel>
              <Input
                id="job-title-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Optional code"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="job-title-name">Name</FieldLabel>
              <Input
                id="job-title-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="job-title-leave-days">Default leave days</FieldLabel>
              <Input
                id="job-title-leave-days"
                type="number"
                min={0}
                value={leaveDays}
                onChange={(e) => setLeaveDays(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !departmentId || isLoading}>
              {isLoading ? 'Adding...' : 'Add job title'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
