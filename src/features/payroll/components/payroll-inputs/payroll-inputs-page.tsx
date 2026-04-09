import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useListEmployeeOptionsQuery } from '@/features/hr';
import { ApprovalStatus, PayrollItemType } from '@/db/schemas/enums';
import {
  useApprovePayrollManualAdjustmentMutation,
  useApprovePayrollOvertimeEntryMutation,
  useCreatePayrollManualAdjustmentMutation,
  useCreatePayrollOvertimeEntryMutation,
  useListDeductionTypesQuery,
  useListEarningTypesQuery,
  useListPayrollCyclesQuery,
  useListPayrollManualAdjustmentsQuery,
  useListPayrollOvertimeEntriesQuery,
  useRejectPayrollManualAdjustmentMutation,
  useRejectPayrollOvertimeEntryMutation,
} from '../../api/payroll.api';

function formatMoneyPsw(amountPsw: number, currencyCode = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountPsw ?? 0) / 100);
}

function formatMinutes(minutes: number) {
  const totalMinutes = Number(minutes ?? 0);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function approvalStatusLabel(status: number, hasManager: boolean) {
  if (!hasManager && status === ApprovalStatus.APPROVED) return 'Auto-approved';
  switch (status) {
    case ApprovalStatus.APPROVED:
      return 'Approved';
    case ApprovalStatus.REJECTED:
      return 'Rejected';
    default:
      return 'Pending';
  }
}

export function PayrollInputsPage() {
  const [searchParams] = useSearchParams();
  const initialCycleId = searchParams.get('cycleId') ?? '';
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [overtimeEmployeeId, setOvertimeEmployeeId] = useState('');
  const [overtimeMinutes, setOvertimeMinutes] = useState('');
  const [overtimeRatePerHourPsw, setOvertimeRatePerHourPsw] = useState('');
  const [overtimeMultiplierPct, setOvertimeMultiplierPct] = useState('150');
  const [overtimeNotes, setOvertimeNotes] = useState('');
  const [adjustmentEmployeeId, setAdjustmentEmployeeId] = useState('');
  const [adjustmentItemType, setAdjustmentItemType] = useState(String(PayrollItemType.EARNING));
  const [adjustmentTypeId, setAdjustmentTypeId] = useState('');
  const [adjustmentAmountPsw, setAdjustmentAmountPsw] = useState('');
  const [adjustmentIsTaxable, setAdjustmentIsTaxable] = useState(true);
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const { data: cyclesData } = useListPayrollCyclesQuery({ pageSize: 100 });
  const { data: employees = [] } = useListEmployeeOptionsQuery();
  const { data: earningTypesData } = useListEarningTypesQuery({ pageSize: 100 });
  const { data: deductionTypesData } = useListDeductionTypesQuery({ pageSize: 100 });
  const authUser = useAuthStore((state) => state.user as AuthUser | null);
  const currentEmployeeId = authUser?.employeeId ?? null;
  const permissions = new Set(authUser?.permissions ?? []);
  const activeCycleId = selectedCycleId || initialCycleId;
  const { data: overtimeEntries = [], isLoading: isLoadingOvertime } =
    useListPayrollOvertimeEntriesQuery(activeCycleId, { skip: !activeCycleId });
  const { data: manualAdjustments = [], isLoading: isLoadingAdjustments } =
    useListPayrollManualAdjustmentsQuery(activeCycleId, { skip: !activeCycleId });
  const [createPayrollOvertimeEntry, { isLoading: isCreatingOvertime }] =
    useCreatePayrollOvertimeEntryMutation();
  const [approvePayrollOvertimeEntry, { isLoading: isApprovingOvertime }] =
    useApprovePayrollOvertimeEntryMutation();
  const [rejectPayrollOvertimeEntry, { isLoading: isRejectingOvertime }] =
    useRejectPayrollOvertimeEntryMutation();
  const [createPayrollManualAdjustment, { isLoading: isCreatingAdjustment }] =
    useCreatePayrollManualAdjustmentMutation();
  const [approvePayrollManualAdjustment, { isLoading: isApprovingAdjustment }] =
    useApprovePayrollManualAdjustmentMutation();
  const [rejectPayrollManualAdjustment, { isLoading: isRejectingAdjustment }] =
    useRejectPayrollManualAdjustmentMutation();

  const cycles = useMemo(() => cyclesData?.data ?? [], [cyclesData]);
  const earningTypes = useMemo(() => earningTypesData?.data ?? [], [earningTypesData]);
  const deductionTypes = useMemo(() => deductionTypesData?.data ?? [], [deductionTypesData]);
  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === activeCycleId) ?? null,
    [activeCycleId, cycles],
  );
  const availableTypes =
    Number(adjustmentItemType) === PayrollItemType.DEDUCTION ? deductionTypes : earningTypes;

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Payroll Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={selectedCycleId}
                onChange={(event) => setSelectedCycleId(event.target.value)}
              >
                <option value="">Select payroll cycle</option>
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {selectedCycle
                  ? `${selectedCycle.periodStart?.slice(0, 10)} to ${selectedCycle.periodEnd?.slice(0, 10)}`
                  : 'Choose a cycle to manage variable payroll inputs'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overtime" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overtime">Overtime</TabsTrigger>
            <TabsTrigger value="adjustments">Manual adjustments</TabsTrigger>
          </TabsList>

          <TabsContent value="overtime">
            <Card>
              <CardHeader>
                <CardTitle>Overtime Entries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-5">
                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={overtimeEmployeeId}
                    onChange={(event) => setOvertimeEmployeeId(event.target.value)}
                  >
                    <option value="">Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.displayName} ({employee.employeeNumber})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Minutes"
                    value={overtimeMinutes}
                    onChange={(event) => setOvertimeMinutes(event.target.value)}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Rate per hour (psw)"
                    value={overtimeRatePerHourPsw}
                    onChange={(event) => setOvertimeRatePerHourPsw(event.target.value)}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Multiplier %"
                    value={overtimeMultiplierPct}
                    onChange={(event) => setOvertimeMultiplierPct(event.target.value)}
                  />
                  <Button
                    disabled={
                      !activeCycleId ||
                      !overtimeEmployeeId ||
                      !overtimeMinutes ||
                      !overtimeRatePerHourPsw ||
                      isCreatingOvertime
                    }
                    onClick={async () => {
                      await createPayrollOvertimeEntry({
                        payrollCycleId: activeCycleId,
                        employeeId: overtimeEmployeeId,
                        overtimeMinutes: Number(overtimeMinutes),
                        ratePerHourPsw: Number(overtimeRatePerHourPsw),
                        multiplierPct: Number(overtimeMultiplierPct || '100'),
                        notes: overtimeNotes.trim() || null,
                      }).unwrap();
                      setOvertimeEmployeeId('');
                      setOvertimeMinutes('');
                      setOvertimeRatePerHourPsw('');
                      setOvertimeMultiplierPct('150');
                      setOvertimeNotes('');
                    }}
                  >
                    Add overtime
                  </Button>
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={overtimeNotes}
                  onChange={(event) => setOvertimeNotes(event.target.value)}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Minutes</TableHead>
                      <TableHead>Rate/hour</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!activeCycleId ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          Select a payroll cycle to view overtime entries.
                        </TableCell>
                      </TableRow>
                    ) : isLoadingOvertime ? (
                      <TableRow>
                        <TableCell colSpan={7}>Loading overtime entries...</TableCell>
                      </TableRow>
                    ) : overtimeEntries.length ? (
                      overtimeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {entry.employeeName} ({entry.employeeNumber})
                          </TableCell>
                          <TableCell>{formatMinutes(entry.overtimeMinutes)}</TableCell>
                          <TableCell>{formatMoneyPsw(entry.ratePerHourPsw)}</TableCell>
                          <TableCell>{entry.multiplierPct}%</TableCell>
                          <TableCell>
                            {approvalStatusLabel(
                              entry.approvalStatus,
                              Boolean(entry.supervisorEmployeeId),
                            )}
                          </TableCell>
                          <TableCell>{entry.notes ?? '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  entry.approvalStatus !== ApprovalStatus.PENDING ||
                                  entry.supervisorEmployeeId !== currentEmployeeId ||
                                  !permissions.has(PermissionKeys.CanApproveManagedPayrollInputs) ||
                                  isApprovingOvertime
                                }
                                onClick={async () => {
                                  await approvePayrollOvertimeEntry({
                                    payrollCycleId: activeCycleId,
                                    entryId: entry.id,
                                  }).unwrap();
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  entry.approvalStatus !== ApprovalStatus.PENDING ||
                                  entry.supervisorEmployeeId !== currentEmployeeId ||
                                  !permissions.has(PermissionKeys.CanApproveManagedPayrollInputs) ||
                                  isRejectingOvertime
                                }
                                onClick={async () => {
                                  await rejectPayrollOvertimeEntry({
                                    payrollCycleId: activeCycleId,
                                    entryId: entry.id,
                                    reason: null,
                                  }).unwrap();
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7}>No overtime entries added for this cycle.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adjustments">
            <Card>
              <CardHeader>
                <CardTitle>Manual Adjustments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-5">
                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={adjustmentEmployeeId}
                    onChange={(event) => setAdjustmentEmployeeId(event.target.value)}
                  >
                    <option value="">Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.displayName} ({employee.employeeNumber})
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={adjustmentItemType}
                    onChange={(event) => {
                      const nextItemType = event.target.value;
                      setAdjustmentItemType(nextItemType);
                      setAdjustmentTypeId('');
                      if (Number(nextItemType) === PayrollItemType.DEDUCTION) {
                        setAdjustmentIsTaxable(false);
                      }
                    }}
                  >
                    <option value={String(PayrollItemType.EARNING)}>Earning</option>
                    <option value={String(PayrollItemType.DEDUCTION)}>Deduction</option>
                  </select>
                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={adjustmentTypeId}
                    onChange={(event) => setAdjustmentTypeId(event.target.value)}
                  >
                    <option value="">Select type</option>
                    {availableTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.code} - {type.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Amount (psw)"
                    value={adjustmentAmountPsw}
                    onChange={(event) => setAdjustmentAmountPsw(event.target.value)}
                  />
                  <Button
                    disabled={
                      !activeCycleId ||
                      !adjustmentEmployeeId ||
                      !adjustmentTypeId ||
                      !adjustmentAmountPsw ||
                      isCreatingAdjustment
                    }
                    onClick={async () => {
                      const itemType = Number(adjustmentItemType);
                      await createPayrollManualAdjustment({
                        payrollCycleId: activeCycleId,
                        employeeId: adjustmentEmployeeId,
                        itemType,
                        earningTypeId:
                          itemType === PayrollItemType.EARNING ? adjustmentTypeId : null,
                        deductionTypeId:
                          itemType === PayrollItemType.DEDUCTION ? adjustmentTypeId : null,
                        amountPsw: Number(adjustmentAmountPsw),
                        isTaxable:
                          itemType === PayrollItemType.DEDUCTION ? false : adjustmentIsTaxable,
                        notes: adjustmentNotes.trim() || null,
                      }).unwrap();
                      setAdjustmentEmployeeId('');
                      setAdjustmentTypeId('');
                      setAdjustmentAmountPsw('');
                      setAdjustmentNotes('');
                      setAdjustmentIsTaxable(true);
                      setAdjustmentItemType(String(PayrollItemType.EARNING));
                    }}
                  >
                    Add adjustment
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={adjustmentIsTaxable}
                      disabled={Number(adjustmentItemType) === PayrollItemType.DEDUCTION}
                      onChange={(event) => setAdjustmentIsTaxable(event.target.checked)}
                    />
                    Taxable earning
                  </label>
                </div>

                <Input
                  placeholder="Notes (optional)"
                  value={adjustmentNotes}
                  onChange={(event) => setAdjustmentNotes(event.target.value)}
                />

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Taxable</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!activeCycleId ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          Select a payroll cycle to view manual adjustments.
                        </TableCell>
                      </TableRow>
                    ) : isLoadingAdjustments ? (
                      <TableRow>
                        <TableCell colSpan={8}>Loading manual adjustments...</TableCell>
                      </TableRow>
                    ) : manualAdjustments.length ? (
                      manualAdjustments.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {entry.employeeName} ({entry.employeeNumber})
                          </TableCell>
                          <TableCell>
                            {entry.itemType === PayrollItemType.DEDUCTION ? 'Deduction' : 'Earning'}
                          </TableCell>
                          <TableCell>
                            {entry.code} - {entry.name}
                          </TableCell>
                          <TableCell>{formatMoneyPsw(entry.amountPsw)}</TableCell>
                          <TableCell>
                            {entry.itemType === PayrollItemType.DEDUCTION
                              ? 'No'
                              : entry.isTaxable
                                ? 'Yes'
                                : 'No'}
                          </TableCell>
                          <TableCell>
                            {approvalStatusLabel(
                              entry.approvalStatus,
                              Boolean(entry.supervisorEmployeeId),
                            )}
                          </TableCell>
                          <TableCell>{entry.notes ?? '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  entry.approvalStatus !== ApprovalStatus.PENDING ||
                                  entry.supervisorEmployeeId !== currentEmployeeId ||
                                  !permissions.has(PermissionKeys.CanApproveManagedPayrollInputs) ||
                                  isApprovingAdjustment
                                }
                                onClick={async () => {
                                  await approvePayrollManualAdjustment({
                                    payrollCycleId: activeCycleId,
                                    entryId: entry.id,
                                  }).unwrap();
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  entry.approvalStatus !== ApprovalStatus.PENDING ||
                                  entry.supervisorEmployeeId !== currentEmployeeId ||
                                  !permissions.has(PermissionKeys.CanApproveManagedPayrollInputs) ||
                                  isRejectingAdjustment
                                }
                                onClick={async () => {
                                  await rejectPayrollManualAdjustment({
                                    payrollCycleId: activeCycleId,
                                    entryId: entry.id,
                                    reason: null,
                                  }).unwrap();
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8}>
                          No manual adjustments added for this cycle.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollableWrapper>
    </div>
  );
}
