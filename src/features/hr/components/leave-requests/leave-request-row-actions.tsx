import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { LeaveRequest } from '../../api/hr.api';

type LeaveRequestRowActionsProps = {
  row: LeaveRequest;
  currentEmployeeId: string | null;
  permissions: Set<string>;
  canCreateLeaveRequest: boolean;
  isSubmittingLeaveRequest: boolean;
  isManagerApprovingLeaveRequest: boolean;
  isManagerRejectingLeaveRequest: boolean;
  isApprovingLeaveRequest: boolean;
  isRejectingLeaveRequest: boolean;
  onEdit: (leaveRequest: LeaveRequest) => void;
  onManagerApprove: (id: string) => void | Promise<void>;
  onManagerReject: (id: string) => void | Promise<void>;
  onApprove: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
};

export function LeaveRequestRowActions({
  row,
  currentEmployeeId,
  permissions,
  canCreateLeaveRequest,
  isSubmittingLeaveRequest,
  isManagerApprovingLeaveRequest,
  isManagerRejectingLeaveRequest,
  isApprovingLeaveRequest,
  isRejectingLeaveRequest,
  onEdit,
  onManagerApprove,
  onManagerReject,
  onApprove,
  onReject,
}: LeaveRequestRowActionsProps) {
  const canEdit =
    canCreateLeaveRequest &&
    row.status === 0 &&
    (row.managerApprovalStatus === 0 || !row.supervisorEmployeeId) &&
    !isSubmittingLeaveRequest;

  const canManagerAction =
    row.status === 0 &&
    row.managerApprovalStatus === 0 &&
    row.supervisorEmployeeId === currentEmployeeId &&
    permissions.has(PermissionKeys.CanApproveManagedLeaveRequests);

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => onEdit(row)}>
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!canManagerAction || isManagerApprovingLeaveRequest}
        onClick={() => void onManagerApprove(row.id)}
      >
        Mgr approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!canManagerAction || isManagerRejectingLeaveRequest}
        onClick={() => void onManagerReject(row.id)}
      >
        Mgr reject
      </Button>
      <Button
        size="sm"
        disabled={row.status !== 0 || row.managerApprovalStatus !== 1 || isApprovingLeaveRequest}
        onClick={() => void onApprove(row.id)}
      >
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={row.status !== 0 || isRejectingLeaveRequest}
        onClick={() => void onReject(row.id)}
      >
        Reject
      </Button>
    </div>
  );
}
