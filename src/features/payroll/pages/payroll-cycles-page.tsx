import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useApprovePayrollCycleMutation,
  useCreatePayrollCycleMutation,
  useGetPayrollBankExportQuery,
  useJournalizePayrollCycleMutation,
  useListPayrollCyclesQuery,
  useListPayrollGroupsQuery,
  useListPayslipsQuery,
  useReopenPayrollCycleMutation,
  useReversePayrollCycleMutation,
  useRunPayrollCycleMutation,
} from '../api/payroll.api';

function escapeCsv(value: string | number) {
  const stringValue = String(value ?? '');
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function downloadCsv(filename: string, rows: string[][]) {
  if (typeof window === 'undefined') return;
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

function formatMoneyPsw(amountPsw: number, currencyCode = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountPsw ?? 0) / 100);
}

function paymentMethodLabel(value?: number | null) {
  switch (value) {
    case 0:
      return 'Cash';
    case 1:
      return 'Bank';
    case 2:
      return 'Mobile Money';
    default:
      return 'Unspecified';
  }
}

function statusLabel(status: number) {
  switch (status) {
    case 1:
      return 'Open';
    case 2:
      return 'Processing';
    case 3:
      return 'Approved';
    case 4:
      return 'Posted';
    default:
      return 'Draft';
  }
}

function runStatusLabel(status?: number | null) {
  if (status === null || status === undefined) return 'Not run';
  switch (status) {
    case 1:
      return 'Processing';
    case 2:
      return 'Completed';
    case 3:
      return 'Approved';
    case 4:
      return 'Posted';
    case 5:
      return 'Failed';
    default:
      return 'Draft';
  }
}

export function PayrollCyclesPage() {
  const [payrollGroupId, setPayrollGroupId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const { data, isLoading } = useListPayrollCyclesQuery({ pageSize: 100 });
  const { data: groupsData } = useListPayrollGroupsQuery({ pageSize: 100 });
  const { data: payslipsData, isLoading: isLoadingPayslips } = useListPayslipsQuery(
    { payrollCycleId: selectedCycleId, pageSize: 100 },
    { skip: !selectedCycleId },
  );
  const [createPayrollCycle, { isLoading: isCreating }] = useCreatePayrollCycleMutation();
  const [runPayrollCycle, { isLoading: isRunning }] = useRunPayrollCycleMutation();
  const [approvePayrollCycle, { isLoading: isApproving }] = useApprovePayrollCycleMutation();
  const [journalizePayrollCycle, { isLoading: isJournalizing }] =
    useJournalizePayrollCycleMutation();
  const [reopenPayrollCycle, { isLoading: isReopening }] = useReopenPayrollCycleMutation();
  const [reversePayrollCycle, { isLoading: isReversing }] = useReversePayrollCycleMutation();
  const { data: bankExportData } = useGetPayrollBankExportQuery(selectedCycleId, {
    skip: !selectedCycleId,
  });

  const rows = data?.data ?? [];
  const groups = useMemo(() => groupsData?.data ?? [], [groupsData]);
  const payslips = payslipsData?.data ?? [];
  const bankExportRows = bankExportData?.rows ?? [];

  return (
    <div className="w-full space-y-4 p-4">
      <Tabs defaultValue="cycles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cycles">Cycles</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
        </TabsList>

        <TabsContent value="cycles">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Cycles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-4">
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={payrollGroupId}
                  onChange={(e) => setPayrollGroupId(e.target.value)}
                >
                  <option value="">Payroll group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
                <Button
                  disabled={!payrollGroupId || !periodStart || !periodEnd || isCreating}
                  onClick={async () => {
                    await createPayrollCycle({ payrollGroupId, periodStart, periodEnd }).unwrap();
                    setPayrollGroupId('');
                    setPeriodStart('');
                    setPeriodEnd('');
                  }}
                >
                  Create cycle
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Run</TableHead>
                    <TableHead>Journal</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7}>Loading payroll cycles...</TableCell>
                    </TableRow>
                  ) : rows.length ? (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.payrollGroupName ?? '-'}</TableCell>
                        <TableCell>
                          {row.periodStart?.slice(0, 10)} to {row.periodEnd?.slice(0, 10)}
                        </TableCell>
                        <TableCell>{statusLabel(row.status)}</TableCell>
                        <TableCell>{runStatusLabel(row.latestRunStatus)}</TableCell>
                        <TableCell>{row.journalBatchId ? 'Posted' : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isRunning || row.status >= 3}
                              onClick={async () => {
                                await runPayrollCycle(row.id).unwrap();
                                setSelectedCycleId(row.id);
                              }}
                            >
                              Run
                            </Button>
                            <Button
                              size="sm"
                              disabled={isApproving || row.status >= 3}
                              onClick={async () => {
                                await approvePayrollCycle({ id: row.id }).unwrap();
                                setSelectedCycleId(row.id);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isJournalizing || row.status !== 3}
                              onClick={async () => {
                                await journalizePayrollCycle(row.id).unwrap();
                                setSelectedCycleId(row.id);
                              }}
                            >
                              Journalize
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isReversing || !row.journalBatchId}
                              onClick={async () => {
                                await reversePayrollCycle(row.id).unwrap();
                                setSelectedCycleId(row.id);
                              }}
                            >
                              Reverse
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isReopening || row.status === 4}
                              onClick={async () => {
                                await reopenPayrollCycle(row.id).unwrap();
                                setSelectedCycleId(row.id);
                              }}
                            >
                              Reopen
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCycleId(row.id)}
                            >
                              View payslips
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>No payroll cycles found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle>Payslips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                >
                  <option value="">Select payroll cycle</option>
                  {rows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  disabled={!selectedCycleId || !bankExportRows.length}
                  onClick={() => {
                    const selectedCycle = rows.find((row) => row.id === selectedCycleId);
                    downloadCsv(`${selectedCycle?.name ?? 'payroll'}-bank-export.csv`, [
                      [
                        'Payslip Number',
                        'Employee Number',
                        'Employee Name',
                        'Payment Method',
                        'Bank Name',
                        'Account Name',
                        'Account Number',
                        'Mobile Money Number',
                        'Net Pay',
                        'Currency',
                      ],
                      ...bankExportRows.map((row) => [
                        row.payslipId ?? '',
                        row.employeeNumber,
                        row.employeeName,
                        paymentMethodLabel(row.paymentMethod),
                        row.bankName ?? '',
                        row.bankAccountName ?? '',
                        row.bankAccountNumber ?? '',
                        row.mobileMoneyNumber ?? '',
                        String(Number(row.netPayPsw ?? 0) / 100),
                        row.currencyCode,
                      ]),
                    ]);
                  }}
                >
                  Export bank CSV
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payslip No.</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!selectedCycleId ? (
                    <TableRow>
                      <TableCell colSpan={6}>Select a cycle to view generated payslips.</TableCell>
                    </TableRow>
                  ) : isLoadingPayslips ? (
                    <TableRow>
                      <TableCell colSpan={6}>Loading payslips...</TableCell>
                    </TableRow>
                  ) : payslips.length ? (
                    payslips.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.payslipNumber}</TableCell>
                        <TableCell>{row.employeeName}</TableCell>
                        <TableCell>{formatMoneyPsw(row.netPayPsw)}</TableCell>
                        <TableCell>{row.issuedAt?.slice(0, 10) ?? '-'}</TableCell>
                        <TableCell>{row.deliveryStatus ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/payroll/payslips/${row.id}`}>Open</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>No payslips generated for this cycle yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
