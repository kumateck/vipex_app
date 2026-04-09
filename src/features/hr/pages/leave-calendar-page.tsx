import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import {
  useApproveLeaveSwapMutation,
  useConfirmLeaveSwapMutation,
  useCreateLeaveRequestMutation,
  useCreateLeaveSwapMutation,
  useGetLeaveCalendarQuery,
  useListEmployeeOptionsQuery,
  useListLeaveSwapsQuery,
  useListLeaveTypeOptionsQuery,
  useRejectLeaveSwapMutation,
  type LeaveCalendarItem,
} from '../api/hr.api';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfWeekMonday(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function dayDiff(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

function statusLabel(status: number) {
  if (status === 1) return 'Approved';
  if (status === 2) return 'Rejected';
  if (status === 3) return 'Cancelled';
  return 'Pending';
}

function swapStatusLabel(status: number) {
  if (status === 1) return 'Pending HR';
  if (status === 2) return 'Approved';
  if (status === 3) return 'Rejected';
  if (status === 4) return 'Cancelled';
  if (status === 5) return 'Executed';
  return 'Pending Peer';
}

export function LeaveCalendarPage() {
  const [anchorDate, setAnchorDate] = useState(startOfWeekMonday(new Date()));
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [selectionMode, setSelectionMode] = useState<'0' | '1'>('0');
  const [dateFrom, setDateFrom] = useState(toDateInputValue(new Date()));
  const [dateTo, setDateTo] = useState(toDateInputValue(new Date()));
  const [weekStartDate, setWeekStartDate] = useState(
    toDateInputValue(startOfWeekMonday(new Date())),
  );
  const [weekCount, setWeekCount] = useState('1');
  const [sourceLeaveId, setSourceLeaveId] = useState('');
  const [targetLeaveId, setTargetLeaveId] = useState('');
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);

  const authUser = useAuthStore((state) => state.user as AuthUser | null);
  const currentEmployeeId = authUser?.employeeId ?? null;
  const permissions = new Set(authUser?.permissions ?? []);

  const from = toDateInputValue(anchorDate);
  const to = toDateInputValue(addDays(anchorDate, 13));

  const { data: employeeOptions = [] } = useListEmployeeOptionsQuery();
  const { data: leaveTypeOptions = [] } = useListLeaveTypeOptionsQuery();
  const { data: calendar, isFetching: isCalendarFetching } = useGetLeaveCalendarQuery({ from, to });
  const { data: swapsData } = useListLeaveSwapsQuery({ pageSize: 20 });

  const [createLeaveRequest, { isLoading: isCreatingLeave }] = useCreateLeaveRequestMutation();
  const [createLeaveSwap, { isLoading: isCreatingSwap }] = useCreateLeaveSwapMutation();
  const [confirmLeaveSwap, { isLoading: isConfirmingSwap }] = useConfirmLeaveSwapMutation();
  const [approveLeaveSwap, { isLoading: isApprovingSwap }] = useApproveLeaveSwapMutation();
  const [rejectLeaveSwap, { isLoading: isRejectingSwap }] = useRejectLeaveSwapMutation();

  const leaves = calendar?.leaveItems ?? [];
  const employees = calendar?.employees ?? [];
  const swaps = swapsData?.data ?? [];

  const dayHeaders = useMemo(
    () => Array.from({ length: 14 }, (_, idx) => addDays(anchorDate, idx)),
    [anchorDate],
  );

  const leavesByEmployee = useMemo(() => {
    const map = new Map<string, LeaveCalendarItem[]>();
    for (const leave of leaves) {
      const list = map.get(leave.employeeId) ?? [];
      list.push(leave);
      map.set(leave.employeeId, list);
    }
    for (const entry of map.values()) {
      entry.sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
    }
    return map;
  }, [leaves]);

  const selectableSwapTargets = useMemo(() => {
    if (!sourceLeaveId) return [];
    const source = leaves.find((leave) => leave.id === sourceLeaveId);
    if (!source) return [];
    return leaves.filter(
      (leave) =>
        leave.id !== sourceLeaveId && leave.employeeId !== source.employeeId && leave.status === 1,
    );
  }, [leaves, sourceLeaveId]);

  return (
    <ScrollableWrapper>
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Leave Calendar (2 Weeks)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-8">
              <Button variant="outline" onClick={() => setAnchorDate(addDays(anchorDate, -14))}>
                Previous 2 Weeks
              </Button>
              <Button
                variant="outline"
                onClick={() => setAnchorDate(startOfWeekMonday(new Date()))}
              >
                This 2 Weeks
              </Button>
              <Button variant="outline" onClick={() => setAnchorDate(addDays(anchorDate, 14))}>
                Next 2 Weeks
              </Button>
              <Select value={employeeId} onValueChange={setEmployeeId}>
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
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
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
                onValueChange={(value) => setSelectionMode(value as '0' | '1')}
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
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </>
              ) : (
                <>
                  <Input
                    type="date"
                    value={weekStartDate}
                    onChange={(e) => setWeekStartDate(e.target.value)}
                  />
                  <Input
                    type="number"
                    min={1}
                    value={weekCount}
                    onChange={(e) => setWeekCount(e.target.value)}
                    placeholder="Weeks"
                  />
                </>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                disabled={
                  !employeeId ||
                  !leaveTypeId ||
                  isCreatingLeave ||
                  (selectionMode === '0' ? !dateFrom || !dateTo : !weekStartDate || !weekCount)
                }
                onClick={async () => {
                  const start =
                    selectionMode === '1' ? parseDate(weekStartDate) : parseDate(dateFrom);
                  const weeks = Math.max(1, Number(weekCount || '1'));
                  const end =
                    selectionMode === '1' ? addDays(start, weeks * 7 - 1) : parseDate(dateTo);
                  await createLeaveRequest({
                    employeeId,
                    leaveTypeId,
                    dateFrom: toDateInputValue(start),
                    dateTo: toDateInputValue(end),
                    selectionMode: Number(selectionMode),
                    weekStartDate: selectionMode === '1' ? toDateInputValue(start) : null,
                    weekCount: selectionMode === '1' ? weeks : null,
                    reason: null,
                  }).unwrap();
                }}
              >
                Create Leave
              </Button>
            </div>
          </CardContent>
        </Card>

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
                            setSourceLeaveId(leave.id);
                            setTargetLeaveId('');
                            setSwapDialogOpen(true);
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
                      !permissions.has('CanConfirmLeaveSwapRequest') ||
                      isConfirmingSwap
                    }
                    onClick={() => void confirmLeaveSwap(swap.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      swap.status !== 1 ||
                      !permissions.has('CanApproveLeaveSwapRequest') ||
                      isApprovingSwap
                    }
                    onClick={() => void approveLeaveSwap(swap.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      ![0, 1].includes(swap.status) ||
                      !permissions.has('CanApproveLeaveSwapRequest') ||
                      isRejectingSwap
                    }
                    onClick={() => void rejectLeaveSwap({ id: swap.id, reason: null })}
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

        <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave Swap</DialogTitle>
              <DialogDescription>
                Select the target leave range to exchange with this leave.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Select value={sourceLeaveId} onValueChange={setSourceLeaveId}>
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

              <Select value={targetLeaveId} onValueChange={setTargetLeaveId}>
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
              <Button variant="outline" onClick={() => setSwapDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!sourceLeaveId || !targetLeaveId || isCreatingSwap}
                onClick={async () => {
                  await createLeaveSwap({
                    requesterLeaveRequestId: sourceLeaveId,
                    targetLeaveRequestId: targetLeaveId,
                  }).unwrap();
                  setSwapDialogOpen(false);
                  setTargetLeaveId('');
                }}
              >
                Request Swap
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollableWrapper>
  );
}
