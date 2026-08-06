import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { EmployeeOption } from '@/features/hr/api/hr.api';

interface UserEmployeeExistingFormProps {
  employeeId: string;
  employees: EmployeeOption[];
  isLoading: boolean;
  onEmployeeChange: (employeeId: string) => void;
}

export function UserEmployeeExistingForm({
  employeeId,
  employees,
  isLoading,
  onEmployeeChange,
}: UserEmployeeExistingFormProps) {
  return (
    <Field>
      <FieldLabel htmlFor="existing-employee">Unlinked employee</FieldLabel>
      <Select value={employeeId} onValueChange={onEmployeeChange}>
        <SelectTrigger id="existing-employee" disabled={isLoading}>
          <SelectValue placeholder={isLoading ? 'Loading employees...' : 'Select an employee'} />
        </SelectTrigger>
        <SelectContent>
          {employees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.displayName} ({employee.employeeNumber})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        Only employee records without a user account in this user&apos;s branch are shown.
      </FieldDescription>
    </Field>
  );
}
