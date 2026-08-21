import { useMemo, useState, type FormEvent } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useCreatePayrollCycleMutation, useListPayrollGroupsQuery } from '../../api/payroll.api';

function dateValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CreatePayrollCycleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [groupId, setGroupId] = useState('');
  const [period, setPeriod] = useState<DateRange>();
  const { data } = useListPayrollGroupsQuery({ pageSize: 100 });
  const groups = useMemo(() => data?.data ?? [], [data]);
  const [createCycle, { isLoading }] = useCreatePayrollCycleMutation();
  async function submit(event: FormEvent) {
    event.preventDefault();
    const periodStart = dateValue(period?.from);
    const periodEnd = dateValue(period?.to);
    if (!groupId || !periodStart || !periodEnd) return;
    await createCycle({ payrollGroupId: groupId, periodStart, periodEnd }).unwrap();
    setGroupId('');
    setPeriod(undefined);
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="space-y-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create payroll cycle</DialogTitle>
            <DialogDescription>Select the payroll group and processing period.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Payroll group</FieldLabel>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payroll group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Payroll period</FieldLabel>
              <DateRangePicker
                value={period}
                onChange={setPeriod}
                placeholder="Select payroll period"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!groupId || !period?.from || !period?.to || isLoading}>
              {isLoading ? 'Creating...' : 'Create cycle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
