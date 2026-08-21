import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { PayrollFrequency, PayType } from '@/db/schemas/enums';
import type { EmployeeCompensationForm } from './hooks/use-employee-compensation-form';

function parseDate(value: string) {
  const date = value ? new Date(`${value}T00:00:00`) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

function dateValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function frequency(value: number) {
  if (value === PayrollFrequency.MONTHLY) return 'Monthly';
  if (value === PayrollFrequency.WEEKLY) return 'Weekly';
  if (value === PayrollFrequency.BIWEEKLY) return 'Biweekly';
  return String(value);
}

export function EmployeeCompensationFields({ form }: { form: EmployeeCompensationForm }) {
  return (
    <FieldGroup className="grid gap-4 md:grid-cols-2">
      <Field>
        <FieldLabel>Employee</FieldLabel>
        <Select value={form.employeeId} onValueChange={form.setEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {form.employees.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.displayName} ({item.employeeNumber})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Payroll group</FieldLabel>
        <Select value={form.groupId} onValueChange={form.setGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="Select payroll group" />
          </SelectTrigger>
          <SelectContent>
            {form.groups.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} ({frequency(item.payFrequency)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Pay type</FieldLabel>
        <Select value={form.payType} onValueChange={form.setPayType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(PayType.MONTHLY)}>Monthly</SelectItem>
            <SelectItem value={String(PayType.DAILY)}>Daily</SelectItem>
            <SelectItem value={String(PayType.HOURLY)}>Hourly</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="comp-currency">Currency</FieldLabel>
        <Input
          id="comp-currency"
          value={form.currency}
          onChange={(e) => form.setCurrency(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="comp-base-pay">Base pay (psw)</FieldLabel>
        <Input
          id="comp-base-pay"
          value={form.basePay}
          onChange={(e) => form.setBasePay(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Effective from</FieldLabel>
        <DatePicker
          date={parseDate(form.effectiveFrom)}
          onDateChange={(date) => form.setEffectiveFrom(dateValue(date))}
        />
      </Field>
      <Field>
        <FieldLabel>Tax profile</FieldLabel>
        <Select
          value={form.taxProfileId || '__none__'}
          onValueChange={(value) => form.setTaxProfileId(value === '__none__' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No statutory profile</SelectItem>
            {form.taxProfiles.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  );
}
