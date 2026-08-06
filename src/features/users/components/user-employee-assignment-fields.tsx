import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { EmploymentStatus, EmploymentType } from '@/db/schemas/enums';
import type { Department, EmployeeOption, JobTitle } from '@/features/hr/api/hr.api';
import type { EmployeeFromUserForm } from '../types/user-employee-link.types';
import { dateToFormValue, formValueToDate } from '../utils/user-employee-link';

const STATUS_OPTIONS = [
  { value: EmploymentStatus.ACTIVE, label: 'Active' },
  { value: EmploymentStatus.PROBATION, label: 'Probation' },
  { value: EmploymentStatus.INACTIVE, label: 'Inactive' },
];

const TYPE_OPTIONS = [
  { value: EmploymentType.FULL_TIME, label: 'Full-time' },
  { value: EmploymentType.PART_TIME, label: 'Part-time' },
  { value: EmploymentType.CONTRACT, label: 'Contract' },
  { value: EmploymentType.INTERN, label: 'Intern' },
  { value: EmploymentType.CASUAL, label: 'Casual' },
];

interface UserEmployeeAssignmentFieldsProps {
  departments: Department[];
  form: EmployeeFromUserForm;
  jobTitles: JobTitle[];
  supervisors: EmployeeOption[];
  onChange: (patch: Partial<EmployeeFromUserForm>) => void;
}

export function UserEmployeeAssignmentFields({
  departments,
  form,
  jobTitles,
  supervisors,
  onChange,
}: UserEmployeeAssignmentFieldsProps) {
  return (
    <FieldGroup className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="employee-department">Department</FieldLabel>
        <Select
          value={form.departmentId || '__none__'}
          onValueChange={(value) => onChange({ departmentId: value === '__none__' ? '' : value })}
        >
          <SelectTrigger id="employee-department">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No department</SelectItem>
            {departments.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="employee-job-title">Job title</FieldLabel>
        <Select
          value={form.jobTitleId || '__none__'}
          onValueChange={(value) => onChange({ jobTitleId: value === '__none__' ? '' : value })}
        >
          <SelectTrigger id="employee-job-title">
            <SelectValue placeholder="Job title" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No job title</SelectItem>
            {jobTitles.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="employee-supervisor">Reporting manager</FieldLabel>
        <Select
          value={form.supervisorEmployeeId || '__none__'}
          onValueChange={(value) =>
            onChange({ supervisorEmployeeId: value === '__none__' ? '' : value })
          }
        >
          <SelectTrigger id="employee-supervisor">
            <SelectValue placeholder="Reporting manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No reporting manager</SelectItem>
            {supervisors.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Hire date</FieldLabel>
        <DatePicker
          date={formValueToDate(form.hireDate)}
          onDateChange={(date) => onChange({ hireDate: dateToFormValue(date) })}
          placeholder="Select hire date"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="employee-status">Status</FieldLabel>
        <Select
          value={String(form.employmentStatus)}
          onValueChange={(value) =>
            onChange({ employmentStatus: Number(value) as EmploymentStatus })
          }
        >
          <SelectTrigger id="employee-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={String(item.value)}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="employee-type">Employment type</FieldLabel>
        <Select
          value={String(form.employmentType)}
          onValueChange={(value) => onChange({ employmentType: Number(value) as EmploymentType })}
        >
          <SelectTrigger id="employee-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={String(item.value)}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  );
}
