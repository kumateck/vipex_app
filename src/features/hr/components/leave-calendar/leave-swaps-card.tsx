import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { LeaveSwap } from '../../api/hr.api';
import { swapStatusLabel } from './leave-calendar-utils';

type LeaveSwapsCardProps = {
  swaps: LeaveSwap[];
  currentEmployeeId: string | null;
  permissions: Set<string>;
  isConfirmingSwap: boolean;
  isApprovingSwap: boolean;
  isRejectingSwap: boolean;
  onConfirmSwap: (id: string) => void;
  onApproveSwap: (id: string) => void;
  onRejectSwap: (id: string) => void;
};

export function LeaveSwapsCard({
  swaps,
  currentEmployeeId,
  permissions,
  isConfirmingSwap,
  isApprovingSwap,
  isRejectingSwap,
  onConfirmSwap,
  onApproveSwap,
  onRejectSwap,
}: LeaveSwapsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Swaps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {swaps.map((swap) => (
          <div
            key={swap.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm"
          >
            <div>
              <div className="font-medium">
                {swap.requesterEmployeeName ?? swap.requesterEmployeeId} ↔{' '}
                {swap.targetEmployeeName ?? swap.targetEmployeeId}
              </div>
              <div className="text-xs text-muted-foreground">
                Status: {swapStatusLabel(swap.status)}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{swapStatusLabel(swap.status)}</Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  swap.status !== 0 ||
                  !currentEmployeeId ||
                  !permissions.has(PermissionKeys.CanConfirmLeaveSwapRequest) ||
                  isConfirmingSwap
                }
                onClick={() => onConfirmSwap(swap.id)}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                disabled={
                  swap.status !== 1 ||
                  !permissions.has(PermissionKeys.CanApproveLeaveSwapRequest) ||
                  isApprovingSwap
                }
                onClick={() => onApproveSwap(swap.id)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  ![0, 1].includes(swap.status) ||
                  !permissions.has(PermissionKeys.CanApproveLeaveSwapRequest) ||
                  isRejectingSwap
                }
                onClick={() => onRejectSwap(swap.id)}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
        {!swaps.length ? (
          <div className="text-sm text-muted-foreground">No leave swaps yet.</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
