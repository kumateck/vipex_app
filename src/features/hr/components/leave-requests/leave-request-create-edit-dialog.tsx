import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { EmployeeOption } from '../../api/hr.api';

type LeaveRequestCreateEditDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  employees: EmployeeOption[];
  leaveTypeOptions: Array<{ id: string; name: string }>;
  employeeId: string;
  leaveTypeId: string;
  requestRange: DateRange | undefined;
  isEmergency: string;
  reason: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeIdChange: (value: string) => void;
  onLeaveTypeIdChange: (value: string) => void;
  onRequestRangeChange: (value: DateRange | undefined) => void;
  onIsEmergencyChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
};

export function LeaveRequestCreateEditDialog({
  open,
  mode,
  employees,
  leaveTypeOptions,
  employeeId,
  leaveTypeId,
  requestRange,
  isEmergency,
  reason,
  isSubmitting,
  onOpenChange,
  onEmployeeIdChange,
  onLeaveTypeIdChange,
  onRequestRangeChange,
  onIsEmergencyChange,
  onReasonChange,
  onSubmit,
}: LeaveRequestCreateEditDialogProps) {
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Leave Request' : 'Request Leave'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the leave request details.'
              : 'Enter leave details and submit for approval.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={employeeId} onValueChange={onEmployeeIdChange}>
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

          <Select value={leaveTypeId} onValueChange={onLeaveTypeIdChange}>
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
            onChange={onRequestRangeChange}
            placeholder="Select leave date range"
            className="sm:col-span-2"
          />

          <Select value={isEmergency} onValueChange={onIsEmergencyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Emergency?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Planned</SelectItem>
              <SelectItem value="true">Emergency (same day)</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              !employeeId ||
              !leaveTypeId ||
              !requestRange?.from ||
              !requestRange?.to ||
              isSubmitting
            }
            onClick={() => void onSubmit()}
          >
            {isEditMode
              ? isSubmitting
                ? 'Saving...'
                : 'Save changes'
              : isSubmitting
                ? 'Requesting...'
                : 'Request leave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
