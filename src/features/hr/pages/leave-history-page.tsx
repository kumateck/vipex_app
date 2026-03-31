import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EntityAuditHistoryCard } from '@/features/audit/components/entity-audit-history-card';
import {
  useListEmployeesQuery,
  useListLeaveRequestsQuery,
  useListLeaveTypeOptionsQuery,
} from '../api/hr.api';

function leaveStatusLabel(status: number) {
  switch (status) {
    case 1:
      return 'Approved';
    case 2:
      return 'Rejected';
    case 3:
      return 'Cancelled';
    default:
      return 'Pending';
  }
}

function managerApprovalLabel(status: number, hasManager: boolean) {
  if (!hasManager && status === 1) return 'Auto-approved';
  switch (status) {
    case 1:
      return 'Approved';
    case 2:
      return 'Rejected';
    default:
      return 'Pending';
  }
}

function toDateInputValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function LeaveHistoryPage() {
  const [employeeId, setEmployeeId] = useState('__all__');
  const [leaveTypeId, setLeaveTypeId] = useState('__all__');
  const [status, setStatus] = useState('__all__');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [selectedLeaveRequestId, setSelectedLeaveRequestId] = useState('');

  const { data: leaveTypeOptions = [] } = useListLeaveTypeOptionsQuery();
  const { data: employeesData } = useListEmployeesQuery({ pageSize: 200 });
  const employees = employeesData?.data ?? [];

  const { data: leaveRequestsData, isLoading } = useListLeaveRequestsQuery({
    pageSize: 200,
    employeeId: employeeId === '__all__' ? null : employeeId,
    leaveTypeId: leaveTypeId === '__all__' ? null : leaveTypeId,
    status: status === '__all__' ? null : Number(status),
    dateFrom,
    dateTo,
  });
  const leaveRequests = leaveRequestsData?.data ?? [];

  const requestRange: DateRange | undefined = {
    from: dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined,
    to: dateTo ? new Date(`${dateTo}T00:00:00`) : undefined,
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-4">
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All leave types</SelectItem>
                  {leaveTypeOptions.map((leaveType) => (
                    <SelectItem key={leaveType.id} value={leaveType.id}>
                      {leaveType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  <SelectItem value="0">Pending</SelectItem>
                  <SelectItem value="1">Approved</SelectItem>
                  <SelectItem value="2">Rejected</SelectItem>
                  <SelectItem value="3">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker
                value={requestRange}
                onChange={(value) => {
                  setDateFrom(toDateInputValue(value?.from));
                  setDateTo(toDateInputValue(value?.to));
                }}
                placeholder="Date range"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading leave history...</TableCell>
                  </TableRow>
                ) : leaveRequests.length ? (
                  leaveRequests.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.employeeName ?? '-'}</TableCell>
                      <TableCell>{row.leaveTypeName ?? '-'}</TableCell>
                      <TableCell>
                        {row.dateFrom.slice(0, 10)} to {row.dateTo.slice(0, 10)}
                      </TableCell>
                      <TableCell>{row.daysCount}</TableCell>
                      <TableCell>
                        {managerApprovalLabel(
                          row.managerApprovalStatus,
                          Boolean(row.supervisorEmployeeId),
                        )}
                      </TableCell>
                      <TableCell>{leaveStatusLabel(row.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLeaveRequestId(row.id)}
                        >
                          History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>No leave history found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <EntityAuditHistoryCard
          title="Leave Request History"
          entityType="leave_request"
          entityId={selectedLeaveRequestId}
        />
      </div>
    </ScrollableWrapper>
  );
}
