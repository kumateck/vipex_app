import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { LeaveCalendarItem } from '../../api/hr.api';

type LeaveSwapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLeaveId: string;
  onSourceLeaveIdChange: (value: string) => void;
  targetLeaveId: string;
  onTargetLeaveIdChange: (value: string) => void;
  leaves: LeaveCalendarItem[];
  selectableSwapTargets: LeaveCalendarItem[];
  isCreatingSwap: boolean;
  onRequestSwap: () => void;
};

export function LeaveSwapDialog({
  open,
  onOpenChange,
  sourceLeaveId,
  onSourceLeaveIdChange,
  targetLeaveId,
  onTargetLeaveIdChange,
  leaves,
  selectableSwapTargets,
  isCreatingSwap,
  onRequestSwap,
}: LeaveSwapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Leave Swap</DialogTitle>
          <DialogDescription>
            Select the target leave range to exchange with this leave.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Select value={sourceLeaveId} onValueChange={onSourceLeaveIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="Source leave" />
            </SelectTrigger>
            <SelectContent>
              {leaves
                .filter((leave) => leave.status === 1)
                .map((leave) => (
                  <SelectItem key={leave.id} value={leave.id}>
                    {leave.leaveTypeName} ({leave.dateFrom.slice(0, 10)} to{' '}
                    {leave.dateTo.slice(0, 10)})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={targetLeaveId} onValueChange={onTargetLeaveIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="Target leave" />
            </SelectTrigger>
            <SelectContent>
              {selectableSwapTargets.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  {leave.leaveTypeName} ({leave.dateFrom.slice(0, 10)} to{' '}
                  {leave.dateTo.slice(0, 10)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!sourceLeaveId || !targetLeaveId || isCreatingSwap}
            onClick={onRequestSwap}
          >
            Request Swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
