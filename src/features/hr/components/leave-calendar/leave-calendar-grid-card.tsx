import { Card, CardContent } from '@/components/ui/card';
import type { LeaveCalendarEmployee, LeaveCalendarItem } from '../../api/hr.api';
import { addDays, dayDiff, parseDate, statusLabel } from './leave-calendar-utils';

type LeaveCalendarGridCardProps = {
  dayHeaders: Date[];
  anchorDate: Date;
  employees: LeaveCalendarEmployee[];
  leavesByEmployee: Map<string, LeaveCalendarItem[]>;
  isCalendarFetching: boolean;
  onLeaveClick: (leave: LeaveCalendarItem) => void;
};

export function LeaveCalendarGridCard({
  dayHeaders,
  anchorDate,
  employees,
  leavesByEmployee,
  isCalendarFetching,
  onLeaveClick,
}: LeaveCalendarGridCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="grid grid-cols-[260px_1fr] gap-2 text-xs font-medium text-muted-foreground">
          <div>Employee</div>
          <div className="grid grid-cols-14 gap-0">
            {dayHeaders.map((date) => (
              <div key={date.toISOString()} className="border px-1 py-1 text-center">
                {date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </div>
            ))}
          </div>
        </div>

        {isCalendarFetching ? (
          <div className="text-sm text-muted-foreground">Loading calendar...</div>
        ) : null}

        {employees.map((employee) => {
          const rowLeaves = leavesByEmployee.get(employee.id) ?? [];
          const rowHeight = Math.max(34, rowLeaves.length * 28);

          return (
            <div key={employee.id} className="grid grid-cols-[260px_1fr] gap-2">
              <div className="rounded-md border px-3 py-2">
                <div className="text-sm font-medium">{employee.displayName}</div>
                <div className="text-xs text-muted-foreground">{employee.employeeNumber}</div>
              </div>
              <div className="relative rounded-md border" style={{ height: `${rowHeight}px` }}>
                <div className="grid h-full grid-cols-14">
                  {dayHeaders.map((date) => (
                    <div
                      key={`${employee.id}-${date.toISOString()}`}
                      className="border-r last:border-r-0"
                    />
                  ))}
                </div>
                {rowLeaves.map((leave, idx) => {
                  const leaveStart = parseDate(leave.dateFrom.slice(0, 10));
                  const leaveEnd = parseDate(leave.dateTo.slice(0, 10));
                  const overlapStart = leaveStart < anchorDate ? anchorDate : leaveStart;
                  const overlapEnd =
                    leaveEnd > addDays(anchorDate, 13) ? addDays(anchorDate, 13) : leaveEnd;

                  if (overlapEnd < overlapStart) return null;

                  const startIndex = Math.max(0, dayDiff(anchorDate, overlapStart));
                  const endIndex = Math.min(13, dayDiff(anchorDate, overlapEnd));
                  const leftPct = (startIndex / 14) * 100;
                  const widthPct = ((endIndex - startIndex + 1) / 14) * 100;
                  const canSwap = leave.status === 1;

                  return (
                    <button
                      key={leave.id}
                      type="button"
                      className="absolute flex h-6 items-center overflow-hidden rounded px-2 text-left text-[11px] text-white"
                      style={{
                        top: `${idx * 26 + 4}px`,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: leave.leaveTypeColorHex || '#22c55e',
                        opacity: leave.status === 0 ? 0.85 : 1,
                      }}
                      onClick={() => {
                        if (!canSwap) return;
                        onLeaveClick(leave);
                      }}
                      disabled={!canSwap}
                      title={`${leave.leaveTypeName ?? 'Leave'} (${statusLabel(leave.status)})`}
                    >
                      <span className="truncate">
                        {leave.leaveTypeName ?? 'Leave'} - {statusLabel(leave.status)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
