import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetAttendanceReportQuery,
  useGetEmployeeMasterReportQuery,
  useGetLeaveRequestsReportQuery,
  useGetPayrollAdjustmentsReportQuery,
  useGetPayrollOvertimeReportQuery,
  useGetPayrollRegisterReportQuery,
} from '@/features/reporting/api/reporting.api';
import { useListPayrollCyclesQuery } from '@/features/payroll';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { DashboardKpiCard } from '../components/dashboard-kpi-card';
import { DashboardBarChartCard, DashboardDonutChartCard } from '../components/dashboard-charts';
import { DashboardExportActions } from '../components/dashboard-export-actions';
import {
  DashboardScopeFilterBar,
  type DashboardScope,
} from '../components/dashboard-scope-filter-bar';
import { RoleDashboardGuard } from '../components/role-dashboard-guard';
import { formatMoneyPsw, formatPercent, isoDate } from '../utils/formatters';

const ALL_CYCLES = '__all_cycles__';

export function HRManagerDashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);
  const [payrollCycleId, setPayrollCycleId] = useState<string>(ALL_CYCLES);

  const canViewEmployees = permissions.has(PermissionKeys.CanListEmployees);
  const canViewAttendance = permissions.has(PermissionKeys.CanListAttendance);
  const canViewLeave = permissions.has(PermissionKeys.CanListLeaveRequests);
  const canViewPayrollRun = permissions.has(PermissionKeys.CanReadPayrollRun);
  const canViewPayrollInputs = permissions.has(PermissionKeys.CanReadPayrollInputs);
  const canViewPayrollCycles = permissions.has(PermissionKeys.CanListPayrollCycles);

  const scopeFrom = scope?.dateRange?.from;
  const scopeTo = scope?.dateRange?.to ?? scope?.dateRange?.from;
  const from = isoDate(scopeFrom);
  const to = isoDate(scopeTo);
  const branchId = scope?.branchId ?? null;
  const locationId = scope?.locationId ?? null;

  const { data: payrollCyclesData } = useListPayrollCyclesQuery(
    { pageSize: 100 },
    { skip: !canViewPayrollCycles },
  );

  const payrollCycles = payrollCyclesData?.data ?? [];
  const selectedPayrollCycleId = payrollCycleId === ALL_CYCLES ? null : payrollCycleId;

  useEffect(() => {
    if (payrollCycleId !== ALL_CYCLES) return;
    const firstCycle = payrollCycles[0]?.id;
    if (firstCycle) {
      setPayrollCycleId(firstCycle);
    }
  }, [payrollCycleId, payrollCycles]);

  const employeeReport = useGetEmployeeMasterReportQuery(
    {
      branchId,
      departmentId: null,
      status: null,
      search: null,
    },
    { skip: !scope || !canViewEmployees },
  );

  const attendanceReport = useGetAttendanceReportQuery(
    {
      from,
      to,
      employeeId: null,
      branchId,
    },
    { skip: !scope || !canViewAttendance },
  );

  const leaveReport = useGetLeaveRequestsReportQuery(
    {
      from,
      to,
      employeeId: null,
      status: null,
    },
    { skip: !scope || !canViewLeave },
  );

  const payrollRegister = useGetPayrollRegisterReportQuery(
    { payrollCycleId: selectedPayrollCycleId ?? '' },
    { skip: !scope || !canViewPayrollRun || !selectedPayrollCycleId },
  );

  const payrollOvertime = useGetPayrollOvertimeReportQuery(
    { payrollCycleId: selectedPayrollCycleId ?? '' },
    { skip: !scope || !canViewPayrollInputs || !selectedPayrollCycleId },
  );

  const payrollAdjustments = useGetPayrollAdjustmentsReportQuery(
    { payrollCycleId: selectedPayrollCycleId ?? '' },
    { skip: !scope || !canViewPayrollInputs || !selectedPayrollCycleId },
  );

  const loading =
    employeeReport.isFetching ||
    attendanceReport.isFetching ||
    leaveReport.isFetching ||
    payrollRegister.isFetching ||
    payrollOvertime.isFetching ||
    payrollAdjustments.isFetching;

  const attendanceCompliance = useMemo(() => {
    const records = attendanceReport.data?.totals.records ?? 0;
    if (!records) return 0;
    return (attendanceReport.data?.totals.checkedOut ?? 0) / records;
  }, [attendanceReport.data?.totals.checkedOut, attendanceReport.data?.totals.records]);

  const selectedCycleLabel = useMemo(() => {
    if (!selectedPayrollCycleId) return 'Not selected';
    return (
      payrollCycles.find((cycle) => cycle.id === selectedPayrollCycleId)?.name ??
      'Selected payroll cycle'
    );
  }, [payrollCycles, selectedPayrollCycleId]);

  const adjustmentsNetPsw =
    Number(payrollAdjustments.data?.totals.earningsPsw ?? 0) -
    Number(payrollAdjustments.data?.totals.deductionsPsw ?? 0);
  const attendanceChartData = [
    { label: 'Records', value: attendanceReport.data?.totals.records ?? 0 },
    { label: 'Checked In', value: attendanceReport.data?.totals.checkedIn ?? 0 },
    { label: 'Checked Out', value: attendanceReport.data?.totals.checkedOut ?? 0 },
  ];
  const payrollInputChartData = [
    { label: 'Overtime Rows', value: payrollOvertime.data?.totals.rows ?? 0 },
    { label: 'Adjustments Rows', value: payrollAdjustments.data?.totals.rows ?? 0 },
    { label: 'Leave Pending', value: leaveReport.data?.totals.pending ?? 0 },
  ];

  return (
    <RoleDashboardGuard role="hr-manager">
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>HR Manager Dashboard</CardTitle>
            <CardDescription>
              Workforce analytics for headcount, attendance, leave pipeline, and payroll inputs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DashboardScopeFilterBar onApply={setScope} />

            {!scope ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Apply scope to load HR analytics.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">Branch: {branchId ?? 'All'}</Badge>
                  <Badge variant="secondary">Location: {locationId ?? 'All'}</Badge>
                  <Badge variant="secondary">
                    Date: {from}
                    {to !== from ? ` to ${to}` : ''}
                  </Badge>
                  <Badge variant="secondary">Payroll cycle: {selectedCycleLabel}</Badge>
                  {loading ? <Badge>Loading...</Badge> : null}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Payroll Cycle</div>
                  <Select
                    value={selectedPayrollCycleId ?? ALL_CYCLES}
                    onValueChange={setPayrollCycleId}
                    disabled={!canViewPayrollCycles}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payroll cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CYCLES}>Select payroll cycle</SelectItem>
                      {payrollCycles.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <DashboardKpiCard
                    label="Headcount"
                    value={canViewEmployees ? (employeeReport.data?.totals.employees ?? 0) : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Active Employees"
                    value={
                      canViewEmployees ? (employeeReport.data?.totals.activeEmployees ?? 0) : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Attendance Compliance"
                    value={canViewAttendance ? formatPercent(attendanceCompliance) : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Leave Backlog"
                    value={canViewLeave ? (leaveReport.data?.totals.pending ?? 0) : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Overtime Estimate"
                    value={
                      canViewPayrollInputs
                        ? formatMoneyPsw(payrollOvertime.data?.totals.estimatedAmountPsw)
                        : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Adjustment Net"
                    value={canViewPayrollInputs ? formatMoneyPsw(adjustmentsNetPsw) : '-'}
                    loading={loading}
                  />
                </div>
                <DashboardExportActions
                  filenamePrefix="hr-manager-dashboard"
                  disabled={!scope}
                  rows={[
                    {
                      metric: 'Headcount',
                      value: canViewEmployees ? (employeeReport.data?.totals.employees ?? 0) : '-',
                    },
                    {
                      metric: 'Active Employees',
                      value: canViewEmployees
                        ? (employeeReport.data?.totals.activeEmployees ?? 0)
                        : '-',
                    },
                    {
                      metric: 'Attendance Compliance',
                      value: canViewAttendance ? formatPercent(attendanceCompliance) : '-',
                    },
                    {
                      metric: 'Leave Backlog',
                      value: canViewLeave ? (leaveReport.data?.totals.pending ?? 0) : '-',
                    },
                    {
                      metric: 'Overtime Estimate',
                      value: canViewPayrollInputs
                        ? formatMoneyPsw(payrollOvertime.data?.totals.estimatedAmountPsw)
                        : '-',
                    },
                    {
                      metric: 'Adjustment Net',
                      value: canViewPayrollInputs ? formatMoneyPsw(adjustmentsNetPsw) : '-',
                    },
                  ]}
                />

                <div className="grid gap-3 lg:grid-cols-2">
                  <DashboardBarChartCard
                    title="Attendance Activity Chart"
                    description="Attendance movement for the selected range."
                    seriesName="Count"
                    data={attendanceChartData}
                  />
                  <DashboardDonutChartCard
                    title="HR Workload Mix Chart"
                    description="Relative operational load across HR queues."
                    data={payrollInputChartData}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Attendance and Leave Snapshot</CardTitle>
                      <CardDescription>Core workforce reliability indicators.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Attendance records</span>
                        <span>
                          {canViewAttendance ? (attendanceReport.data?.totals.records ?? 0) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Checked in</span>
                        <span>
                          {canViewAttendance ? (attendanceReport.data?.totals.checkedIn ?? 0) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Checked out</span>
                        <span>
                          {canViewAttendance
                            ? (attendanceReport.data?.totals.checkedOut ?? 0)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Leave requests</span>
                        <span>{canViewLeave ? (leaveReport.data?.totals.requests ?? 0) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Leave days requested</span>
                        <span>
                          {canViewLeave ? (leaveReport.data?.totals.daysRequested ?? 0) : '-'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Payroll Inputs Snapshot</CardTitle>
                      <CardDescription>
                        Overtime and adjustments for the selected payroll cycle.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Payroll net pay</span>
                        <span>
                          {canViewPayrollRun
                            ? formatMoneyPsw(payrollRegister.data?.totals.netPayPsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payroll employees</span>
                        <span>
                          {canViewPayrollRun ? (payrollRegister.data?.totals.employees ?? 0) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime rows</span>
                        <span>
                          {canViewPayrollInputs ? (payrollOvertime.data?.totals.rows ?? 0) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime minutes</span>
                        <span>
                          {canViewPayrollInputs
                            ? (payrollOvertime.data?.totals.overtimeMinutes ?? 0)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adjustment rows</span>
                        <span>
                          {canViewPayrollInputs ? (payrollAdjustments.data?.totals.rows ?? 0) : '-'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleDashboardGuard>
  );
}
