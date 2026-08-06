import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { EmployeeFromUserForm } from '../types/user-employee-link.types';

interface UserEmployeeNameFieldsProps {
  form: EmployeeFromUserForm;
  onChange: (patch: Partial<EmployeeFromUserForm>) => void;
}

export function UserEmployeeNameFields({ form, onChange }: UserEmployeeNameFieldsProps) {
  return (
    <FieldGroup className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="employee-number">Employee number</FieldLabel>
        <Input
          id="employee-number"
          value={form.employeeNumber}
          onChange={(event) => onChange({ employeeNumber: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="employee-first-name">First name</FieldLabel>
        <Input
          id="employee-first-name"
          value={form.firstName}
          onChange={(event) => onChange({ firstName: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="employee-middle-name">Middle name</FieldLabel>
        <Input
          id="employee-middle-name"
          value={form.middleName}
          onChange={(event) => onChange({ middleName: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="employee-last-name">Last name</FieldLabel>
        <Input
          id="employee-last-name"
          value={form.lastName}
          onChange={(event) => onChange({ lastName: event.target.value })}
        />
      </Field>
    </FieldGroup>
  );
}
