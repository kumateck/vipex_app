import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { EntityAuditHistoryCard } from '@/features/audit/components/entity-audit-history-card';
import { Input } from '@/components/ui/input';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
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
import { useListEmployeesQuery } from '../api/hr.api';
import {
  useApproveLeaveRequestMutation,
  useApproveLeaveRequestByManagerMutation,
  useCreateLeaveRequestMutation,
  useCreateLeaveTypeMutation,
  useListLeaveRequestsQuery,
  useListLeaveTypeOptionsQuery,
  useListLeaveTypesQuery,
  useRejectLeaveRequestMutation,
  useRejectLeaveRequestByManagerMutation,
} from '../api/hr.api';
import type { DateRange } from 'react-day-picker';

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

export function LeavePage() {
  const [leaveTypeCode, setLeaveTypeCode] = useState('');
  const [leaveTypeName, setLeaveTypeName] = useState('');
  const [leaveTypePaid, setLeaveTypePaid] = useState('true');
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [selectedLeaveRequestId, setSelectedLeaveRequestId] = useState('');

  const { data: leaveTypesData } = useListLeaveTypesQuery({ pageSize: 100 });
  const { data: leaveTypeOptions = [] } = useListLeaveTypeOptionsQuery();
  const { data: leaveRequestsData } = useListLeaveRequestsQuery({ pageSize: 100 });
  const { data: employeesData } = useListEmployeesQuery({ pageSize: 100 });
  const authUser = useAuthStore((state) => state.user as AuthUser | null);
  const currentEmployeeId = authUser?.employeeId ?? null;
  const permissions = new Set(authUser?.permissions ?? []);

  const [createLeaveType, { isLoading: isCreatingLeaveType }] = useCreateLeaveTypeMutation();
  const [createLeaveRequest, { isLoading: isCreatingLeaveRequest }] =
    useCreateLeaveRequestMutation();
  const [approveLeaveRequestByManager, { isLoading: isManagerApprovingLeaveRequest }] =
    useApproveLeaveRequestByManagerMutation();
  const [rejectLeaveRequestByManager, { isLoading: isManagerRejectingLeaveRequest }] =
    useRejectLeaveRequestByManagerMutation();
  const [approveLeaveRequest, { isLoading: isApprovingLeaveRequest }] =
    useApproveLeaveRequestMutation();
  const [rejectLeaveRequest, { isLoading: isRejectingLeaveRequest }] =
    useRejectLeaveRequestMutation();

  const leaveTypes = leaveTypesData?.data ?? [];
  const leaveRequests = leaveRequestsData?.data ?? [];
  const employees = employeesData?.data ?? [];
  const requestRange: DateRange | undefined = {
    from: dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined,
    to: dateTo ? new Date(`${dateTo}T00:00:00`) : undefined,
  };

  return (
    <div className="w-full space-y-4 p-4">
      <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Leave Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-4">
              <Input
                placeholder="Code"
                value={leaveTypeCode}
                onChange={(e) => setLeaveTypeCode(e.target.value)}
              />
              <Input
                placeholder="Name"
                value={leaveTypeName}
                onChange={(e) => setLeaveTypeName(e.target.value)}
              />
              <Select value={leaveTypePaid} onValueChange={setLeaveTypePaid}>
                <SelectTrigger>
                  <SelectValue placeholder="Paid?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Paid</SelectItem>
                  <SelectItem value="false">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Button
                disabled={!leaveTypeName.trim() || isCreatingLeaveType}
                onClick={async () => {
                  await createLeaveType({
                    code: leaveTypeCode.trim() || null,
                    name: leaveTypeName.trim(),
                    isPaid: leaveTypePaid === 'true',
                  }).unwrap();
                  setLeaveTypeCode('');
                  setLeaveTypeName('');
                  setLeaveTypePaid('true');
                }}
              >
                Add type
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.length ? (
                  leaveTypes.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.code ?? '-'}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.isPaid ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>No leave types configured.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-5">
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
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
                  {leaveTypeOptions.map((leaveType) => (
                    <SelectItem key={leaveType.id} value={leaveType.id}>
                      {leaveType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DateRangePicker
                value={requestRange}
                onChange={(value) => {
                  setDateFrom(toDateInputValue(value?.from));
                  setDateTo(toDateInputValue(value?.to));
                }}
                placeholder="Select leave date range"
              />
              <Button
                disabled={
                  !employeeId || !leaveTypeId || !dateFrom || !dateTo || isCreatingLeaveRequest
                }
                onClick={async () => {
                  await createLeaveRequest({
                    employeeId,
                    leaveTypeId,
                    dateFrom,
                    dateTo,
                    reason: reason.trim() || null,
                  }).unwrap();
                  setReason('');
                }}
              >
                Request leave
              </Button>
            </div>
            <Input
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.length ? (
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
                          Boolean(row.managerEmployeeId),
                        )}
                      </TableCell>
                      <TableCell>{leaveStatusLabel(row.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLeaveRequestId(row.id)}
                          >
                            History
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              row.status !== 0 ||
                              row.managerApprovalStatus !== 0 ||
                              row.managerEmployeeId !== currentEmployeeId ||
                              !permissions.has('CanApproveManagedLeaveRequests') ||
                              isManagerApprovingLeaveRequest
                            }
                            onClick={async () => {
                              await approveLeaveRequestByManager(row.id).unwrap();
                            }}
                          >
                            Mgr approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              row.status !== 0 ||
                              row.managerApprovalStatus !== 0 ||
                              row.managerEmployeeId !== currentEmployeeId ||
                              !permissions.has('CanApproveManagedLeaveRequests') ||
                              isManagerRejectingLeaveRequest
                            }
                            onClick={async () => {
                              await rejectLeaveRequestByManager({
                                id: row.id,
                                reason: null,
                              }).unwrap();
                            }}
                          >
                            Mgr reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={
                              row.status !== 0 ||
                              row.managerApprovalStatus !== 1 ||
                              isApprovingLeaveRequest
                            }
                            onClick={async () => {
                              await approveLeaveRequest(row.id).unwrap();
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={row.status !== 0 || isRejectingLeaveRequest}
                            onClick={async () => {
                              await rejectLeaveRequest({ id: row.id, reason: null }).unwrap();
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>No leave requests found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <EntityAuditHistoryCard
        title="Leave Request History"
        entityType="leave_request"
        entityId={selectedLeaveRequestId}
      />
    </div>
  );
}
