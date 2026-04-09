import { useMemo, useState } from 'react';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
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
} from '../../api/hr.api';
import { LeaveCalendarControlsCard } from './leave-calendar-controls-card';
import { LeaveCalendarGridCard } from './leave-calendar-grid-card';
import { LeaveSwapDialog } from './leave-swap-dialog';
import { LeaveSwapsCard } from './leave-swaps-card';
import { addDays, parseDate, startOfWeekMonday, toDateInputValue } from './leave-calendar-utils';

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
  const permissions = useMemo(() => new Set(authUser?.permissions ?? []), [authUser?.permissions]);

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

  const canCreateLeave =
    !!employeeId &&
    !!leaveTypeId &&
    !isCreatingLeave &&
    (selectionMode === '0' ? !!dateFrom && !!dateTo : !!weekStartDate && !!weekCount);

  const handleCreateLeave = async () => {
    const start = selectionMode === '1' ? parseDate(weekStartDate) : parseDate(dateFrom);
    const weeks = Math.max(1, Number(weekCount || '1'));
    const end = selectionMode === '1' ? addDays(start, weeks * 7 - 1) : parseDate(dateTo);

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
  };

  const handleLeaveClick = (leave: LeaveCalendarItem) => {
    if (leave.status !== 1) return;
    setSourceLeaveId(leave.id);
    setTargetLeaveId('');
    setSwapDialogOpen(true);
  };

  const handleConfirmSwap = (id: string) => {
    void confirmLeaveSwap(id);
  };

  const handleApproveSwap = (id: string) => {
    void approveLeaveSwap(id);
  };

  const handleRejectSwap = (id: string) => {
    void rejectLeaveSwap({ id, reason: null });
  };

  const handleRequestSwap = async () => {
    await createLeaveSwap({
      requesterLeaveRequestId: sourceLeaveId,
      targetLeaveRequestId: targetLeaveId,
    }).unwrap();
    setSwapDialogOpen(false);
    setTargetLeaveId('');
  };

  return (
    <ScrollableWrapper>
      <div className="space-y-4 p-4">
        <LeaveCalendarControlsCard
          anchorDate={anchorDate}
          onAnchorDateChange={setAnchorDate}
          employeeId={employeeId}
          onEmployeeIdChange={setEmployeeId}
          leaveTypeId={leaveTypeId}
          onLeaveTypeIdChange={setLeaveTypeId}
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          weekStartDate={weekStartDate}
          onWeekStartDateChange={setWeekStartDate}
          weekCount={weekCount}
          onWeekCountChange={setWeekCount}
          employeeOptions={employeeOptions}
          leaveTypeOptions={leaveTypeOptions}
          canCreateLeave={canCreateLeave}
          onCreateLeave={() => {
            void handleCreateLeave();
          }}
        />

        <LeaveCalendarGridCard
          dayHeaders={dayHeaders}
          anchorDate={anchorDate}
          employees={employees}
          leavesByEmployee={leavesByEmployee}
          isCalendarFetching={isCalendarFetching}
          onLeaveClick={handleLeaveClick}
        />

        <LeaveSwapsCard
          swaps={swaps}
          currentEmployeeId={currentEmployeeId}
          permissions={permissions}
          isConfirmingSwap={isConfirmingSwap}
          isApprovingSwap={isApprovingSwap}
          isRejectingSwap={isRejectingSwap}
          onConfirmSwap={handleConfirmSwap}
          onApproveSwap={handleApproveSwap}
          onRejectSwap={handleRejectSwap}
        />

        <LeaveSwapDialog
          open={swapDialogOpen}
          onOpenChange={setSwapDialogOpen}
          sourceLeaveId={sourceLeaveId}
          onSourceLeaveIdChange={setSourceLeaveId}
          targetLeaveId={targetLeaveId}
          onTargetLeaveIdChange={setTargetLeaveId}
          leaves={leaves}
          selectableSwapTargets={selectableSwapTargets}
          isCreatingSwap={isCreatingSwap}
          onRequestSwap={handleRequestSwap}
        />
      </div>
    </ScrollableWrapper>
  );
}
