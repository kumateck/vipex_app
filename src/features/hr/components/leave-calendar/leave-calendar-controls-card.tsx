import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { addDays, parseDate, startOfWeekMonday, toDateInputValue } from './leave-calendar-utils';

type EmployeeOption = {
  id: string;
  displayName: string;
};

type LeaveTypeOption = {
  id: string;
  name: string;
};

type LeaveCalendarControlsCardProps = {
  anchorDate: Date;
  onAnchorDateChange: (value: Date) => void;
  employeeId: string;
  onEmployeeIdChange: (value: string) => void;
  leaveTypeId: string;
  onLeaveTypeIdChange: (value: string) => void;
  selectionMode: '0' | '1';
  onSelectionModeChange: (value: '0' | '1') => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  weekStartDate: string;
  onWeekStartDateChange: (value: string) => void;
  weekCount: string;
  onWeekCountChange: (value: string) => void;
  employeeOptions: EmployeeOption[];
  leaveTypeOptions: LeaveTypeOption[];
  canCreateLeave: boolean;
  onCreateLeave: () => void;
};

export function LeaveCalendarControlsCard({
  anchorDate,
  onAnchorDateChange,
  employeeId,
  onEmployeeIdChange,
  leaveTypeId,
  onLeaveTypeIdChange,
  selectionMode,
  onSelectionModeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  weekStartDate,
  onWeekStartDateChange,
  weekCount,
  onWeekCountChange,
  employeeOptions,
  leaveTypeOptions,
  canCreateLeave,
  onCreateLeave,
}: LeaveCalendarControlsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Calendar (2 Weeks)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-8">
          <Button variant="outline" onClick={() => onAnchorDateChange(addDays(anchorDate, -14))}>
            Previous 2 Weeks
          </Button>
          <Button
            variant="outline"
            onClick={() => onAnchorDateChange(startOfWeekMonday(new Date()))}
          >
            This 2 Weeks
          </Button>
          <Button variant="outline" onClick={() => onAnchorDateChange(addDays(anchorDate, 14))}>
            Next 2 Weeks
          </Button>
          <Select value={employeeId} onValueChange={onEmployeeIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="Employee" />
            </SelectTrigger>
            <SelectContent>
              {employeeOptions.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={leaveTypeId} onValueChange={onLeaveTypeIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="Leave Type" />
            </SelectTrigger>
            <SelectContent>
              {leaveTypeOptions.map((leaveType) => (
                <SelectItem key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectionMode}
            onValueChange={(value) => onSelectionModeChange(value as '0' | '1')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selection Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Day Range</SelectItem>
              <SelectItem value="1">Week Range</SelectItem>
            </SelectContent>
          </Select>
          {selectionMode === '0' ? (
            <>
              <DatePicker
                date={dateFrom ? parseDate(dateFrom) : undefined}
                onDateChange={(date) => onDateFromChange(date ? toDateInputValue(date) : '')}
                placeholder="Start date"
              />
              <DatePicker
                date={dateTo ? parseDate(dateTo) : undefined}
                onDateChange={(date) => onDateToChange(date ? toDateInputValue(date) : '')}
                placeholder="End date"
              />
            </>
          ) : (
            <>
              <DatePicker
                date={weekStartDate ? parseDate(weekStartDate) : undefined}
                onDateChange={(date) => onWeekStartDateChange(date ? toDateInputValue(date) : '')}
                placeholder="Week start"
              />
              <Input
                type="number"
                min={1}
                value={weekCount}
                onChange={(e) => onWeekCountChange(e.target.value)}
                placeholder="Weeks"
              />
            </>
          )}
        </div>
        <div className="flex justify-end">
          <Button disabled={!canCreateLeave} onClick={onCreateLeave}>
            Create Leave
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
