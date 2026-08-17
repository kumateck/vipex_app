import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Employee } from '../../api/hr.api';
import {
  EmployeeAccountBadge,
  EmployeeActionsCell,
  EmployeeAssignmentCell,
  EmployeeIdentityCell,
  EmployeePositionCell,
} from './employee-table-cells';

interface EmployeesTableProps {
  rows: Employee[];
  isLoading: boolean;
  reportingTitleById: Map<string, string>;
  onCreateUser: (employee: Employee) => void;
}

export function EmployeesTable({
  rows,
  isLoading,
  reportingTitleById,
  onCreateUser,
}: EmployeesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Assignment</TableHead>
          <TableHead>User account</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5}>Loading employees...</TableCell>
          </TableRow>
        ) : rows.length ? (
          rows.map((employee) => {
            const reportingTitle = employee.reportingOfficerTitleId
              ? (reportingTitleById.get(employee.reportingOfficerTitleId) ?? 'Not assigned')
              : 'Not assigned';

            return (
              <TableRow key={employee.id}>
                <TableCell>
                  <EmployeeIdentityCell employee={employee} />
                </TableCell>
                <TableCell>
                  <EmployeePositionCell employee={employee} />
                </TableCell>
                <TableCell>
                  <EmployeeAssignmentCell employee={employee} reportingTitle={reportingTitle} />
                </TableCell>
                <TableCell>
                  <EmployeeAccountBadge linked={employee.hasUserAccount} />
                </TableCell>
                <TableCell className="text-right">
                  <EmployeeActionsCell employee={employee} onCreateUser={onCreateUser} />
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={5}>No employees found.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
