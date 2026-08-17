import { EllipsisVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Employee } from '../../api/hr.api';

const PRIMARY_TEXT_CLASS = 'truncate font-medium';
const SECONDARY_TEXT_CLASS = 'truncate text-xs text-muted-foreground';

export function EmployeeIdentityCell({ employee }: { employee: Employee }) {
  const details = employee.email
    ? `${employee.employeeNumber} · ${employee.email}`
    : employee.employeeNumber;

  return (
    <div className="flex w-72 min-w-0 max-w-[32vw] items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={employee.profileImageUrl ?? undefined} alt={employee.displayName} />
        <AvatarFallback>{employee.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0" aria-label={`${employee.displayName}, ${details}`}>
        <p className={PRIMARY_TEXT_CLASS} title={employee.displayName}>
          {employee.displayName}
        </p>
        <p className={SECONDARY_TEXT_CLASS} title={details}>
          {details}
        </p>
      </div>
    </div>
  );
}

export function EmployeePositionCell({ employee }: { employee: Employee }) {
  const jobTitle = employee.jobTitleName ?? 'No job title';
  const department = employee.departmentName ?? 'No department';
  return (
    <div className="w-52 min-w-0 max-w-[22vw]" aria-label={`${jobTitle}, ${department}`}>
      <p className={PRIMARY_TEXT_CLASS} title={jobTitle}>
        {jobTitle}
      </p>
      <p className={SECONDARY_TEXT_CLASS} title={department}>
        {department}
      </p>
    </div>
  );
}

export function EmployeeAssignmentCell({
  employee,
  reportingTitle,
}: {
  employee: Employee;
  reportingTitle: string;
}) {
  const branch = employee.branchName ?? 'No branch';
  const reportingLine = `Reports to: ${reportingTitle}`;
  return (
    <div className="w-56 min-w-0 max-w-[24vw]" aria-label={`${branch}, ${reportingLine}`}>
      <p className={PRIMARY_TEXT_CLASS} title={branch}>
        {branch}
      </p>
      <p className={SECONDARY_TEXT_CLASS} title={reportingLine}>
        {reportingLine}
      </p>
    </div>
  );
}

export function EmployeeAccountBadge({ linked }: { linked: boolean }) {
  return linked ? (
    <Badge
      variant="outline"
      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    >
      Linked
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    >
      Not linked
    </Badge>
  );
}

export function EmployeeActionsCell({
  employee,
  onCreateUser,
}: {
  employee: Employee;
  onCreateUser: (employee: Employee) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={`Actions for ${employee.displayName}`}
        >
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/hr/employees/edit/${employee.id}`}>Edit</Link>
        </DropdownMenuItem>
        {!employee.hasUserAccount ? (
          <DropdownMenuItem disabled={!employee.email} onClick={() => onCreateUser(employee)}>
            Create user
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
