import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  useApproveLeaveRequestMutation,
  useApproveLeaveRequestByManagerMutation,
  useCreateLeaveRequestMutation,
  useListEmployeeOptionsQuery,
  useListLeaveRequestsQuery,
  useListLeaveTypeOptionsQuery,
  useRejectLeaveRequestMutation,
  useRejectLeaveRequestByManagerMutation,
  useUpdateLeaveRequestMutation,
  type LeaveRequest,
} from '../../api/hr.api';
import { LeaveRequestCreateEditDialog } from './leave-request-create-edit-dialog';
import { LeaveRequestRowActions } from './leave-request-row-actions';

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

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function LeaveRequestsPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [dateFrom, setDateFrom] = useState(getTodayDateInputValue());
  const [dateTo, setDateTo] = useState(getTodayDateInputValue());
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState('false');
  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [editingLeaveRequestId, setEditingLeaveRequestId] = useState<string | null>(null);

  const { data: leaveTypeOptions = [] } = useListLeaveTypeOptionsQuery();
  const { data: leaveRequestsData } = useListLeaveRequestsQuery({ pageSize: 100 });
  const { data: employees = [] } = useListEmployeeOptionsQuery();
  const authUser = useAuthStore((state) => state.user as AuthUser | null);
  const currentEmployeeId = authUser?.employeeId ?? null;
  const permissions = new Set(authUser?.permissions ?? []);
  const canCreateLeaveRequest = permissions.has(PermissionKeys.CanCreateLeaveRequest);

  const [createLeaveRequest, { isLoading: isCreatingLeaveRequest }] =
    useCreateLeaveRequestMutation();
  const [updateLeaveRequest, { isLoading: isUpdatingLeaveRequest }] =
    useUpdateLeaveRequestMutation();
  const [approveLeaveRequestByManager, { isLoading: isManagerApprovingLeaveRequest }] =
    useApproveLeaveRequestByManagerMutation();
  const [rejectLeaveRequestByManager, { isLoading: isManagerRejectingLeaveRequest }] =
    useRejectLeaveRequestByManagerMutation();
  const [approveLeaveRequest, { isLoading: isApprovingLeaveRequest }] =
    useApproveLeaveRequestMutation();
  const [rejectLeaveRequest, { isLoading: isRejectingLeaveRequest }] =
    useRejectLeaveRequestMutation();

  const isSubmittingLeaveRequest = isCreatingLeaveRequest || isUpdatingLeaveRequest;
  const leaveRequests = leaveRequestsData?.data ?? [];
  const requestRange: DateRange | undefined = {
    from: dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined,
    to: dateTo ? new Date(`${dateTo}T00:00:00`) : undefined,
  };

  const resetLeaveRequestForm = () => {
    const today = getTodayDateInputValue();
    setEmployeeId('');
    setLeaveTypeId('');
    setDateFrom(today);
    setDateTo(today);
    setReason('');
    setIsEmergency('false');
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateEditDialogOpen(open);
    if (!open) {
      setEditingLeaveRequestId(null);
      resetLeaveRequestForm();
    }
  };

  const openCreateLeaveRequestDialog = () => {
    setEditingLeaveRequestId(null);
    resetLeaveRequestForm();
    setIsCreateEditDialogOpen(true);
  };

  const openEditLeaveRequestDialog = (leaveRequest: LeaveRequest) => {
    setEditingLeaveRequestId(leaveRequest.id);
    setEmployeeId(leaveRequest.employeeId);
    setLeaveTypeId(leaveRequest.leaveTypeId);
    setDateFrom(leaveRequest.dateFrom.slice(0, 10));
    setDateTo(leaveRequest.dateTo.slice(0, 10));
    setReason(leaveRequest.reason ?? '');
    setIsEmergency(leaveRequest.isEmergency ? 'true' : 'false');
    setIsCreateEditDialogOpen(true);
  };

  const submitLeaveRequest = async () => {
    const payload = {
      employeeId,
      leaveTypeId,
      dateFrom,
      dateTo,
      isEmergency: isEmergency === 'true',
      reason: reason.trim() || null,
    };

    if (editingLeaveRequestId) {
      await updateLeaveRequest({ id: editingLeaveRequestId, body: payload }).unwrap();
    } else {
      await createLeaveRequest(payload).unwrap();
    }

    handleDialogOpenChange(false);
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button disabled={!canCreateLeaveRequest} onClick={openCreateLeaveRequestDialog}>
                Request leave
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Request Mode</TableHead>
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
                      <TableCell>{row.isEmergency ? 'Emergency' : 'Planned'}</TableCell>
                      <TableCell>
                        {managerApprovalLabel(
                          row.managerApprovalStatus,
                          Boolean(row.supervisorEmployeeId),
                        )}
                      </TableCell>
                      <TableCell>{leaveStatusLabel(row.status)}</TableCell>
                      <TableCell className="text-right">
                        <LeaveRequestRowActions
                          row={row}
                          currentEmployeeId={currentEmployeeId}
                          permissions={permissions}
                          canCreateLeaveRequest={canCreateLeaveRequest}
                          isSubmittingLeaveRequest={isSubmittingLeaveRequest}
                          isManagerApprovingLeaveRequest={isManagerApprovingLeaveRequest}
                          isManagerRejectingLeaveRequest={isManagerRejectingLeaveRequest}
                          isApprovingLeaveRequest={isApprovingLeaveRequest}
                          isRejectingLeaveRequest={isRejectingLeaveRequest}
                          onEdit={openEditLeaveRequestDialog}
                          onManagerApprove={async (id) => {
                            await approveLeaveRequestByManager(id).unwrap();
                          }}
                          onManagerReject={async (id) => {
                            await rejectLeaveRequestByManager({ id, reason: null }).unwrap();
                          }}
                          onApprove={async (id) => {
                            await approveLeaveRequest(id).unwrap();
                          }}
                          onReject={async (id) => {
                            await rejectLeaveRequest({ id, reason: null }).unwrap();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>No leave requests found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <LeaveRequestCreateEditDialog
        open={isCreateEditDialogOpen}
        mode={editingLeaveRequestId ? 'edit' : 'create'}
        employees={employees}
        leaveTypeOptions={leaveTypeOptions}
        employeeId={employeeId}
        leaveTypeId={leaveTypeId}
        requestRange={requestRange}
        isEmergency={isEmergency}
        reason={reason}
        isSubmitting={isSubmittingLeaveRequest}
        onOpenChange={handleDialogOpenChange}
        onEmployeeIdChange={setEmployeeId}
        onLeaveTypeIdChange={setLeaveTypeId}
        onRequestRangeChange={(value) => {
          setDateFrom(toDateInputValue(value?.from));
          setDateTo(toDateInputValue(value?.to));
        }}
        onIsEmergencyChange={setIsEmergency}
        onReasonChange={setReason}
        onSubmit={submitLeaveRequest}
      />
    </ScrollableWrapper>
  );
}
