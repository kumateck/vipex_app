import { Badge } from '@/components/ui/badge';
import type { Department, EmployeeOption, JobTitle } from '@/features/hr/api/hr.api';
import type { EmployeeFromUserForm } from '../types/user-employee-link.types';
import type { User } from '../types/user.types';
import { UserEmployeeAssignmentFields } from './user-employee-assignment-fields';
import { UserEmployeeNameFields } from './user-employee-name-fields';

interface UserEmployeeNewFormProps {
  departments: Department[];
  form: EmployeeFromUserForm;
  jobTitles: JobTitle[];
  supervisors: EmployeeOption[];
  user: User;
  onChange: (patch: Partial<EmployeeFromUserForm>) => void;
}

export function UserEmployeeNewForm({
  departments,
  form,
  jobTitles,
  supervisors,
  user,
  onChange,
}: UserEmployeeNewFormProps) {
  return (
    <div className="max-h-[58vh] space-y-5 overflow-y-auto pr-1">
      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{user.fullname}</span>
          <Badge variant="outline">{user.branchName ?? 'Assigned branch'}</Badge>
        </div>
        <p className="mt-1 text-muted-foreground">
          {user.email} · {user.telephone}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Email, telephone, branch, and location will be inherited from the user account.
        </p>
      </div>
      <UserEmployeeNameFields form={form} onChange={onChange} />
      <UserEmployeeAssignmentFields
        departments={departments}
        form={form}
        jobTitles={jobTitles}
        supervisors={supervisors}
        onChange={onChange}
      />
    </div>
  );
}
