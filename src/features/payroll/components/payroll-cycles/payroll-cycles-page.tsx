import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EntityAuditHistoryCard } from '@/features/audit/components/entity-audit-history-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  useJournalizePayrollCycleMutation,
  useListPayrollCyclesQuery,
  useReopenPayrollCycleMutation,
  useReversePayrollCycleMutation,
  useRunPayrollCycleMutation,
} from '../../api/payroll.api';
import { CreatePayrollCycleDialog } from './create-payroll-cycle-dialog';
import { PayrollPayslipsTab } from './payroll-payslips-tab';

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const { data, isLoading } = useListPayrollCyclesQuery({ pageSize: 100 });
  const [runPayrollCycle, { isLoading: isRunning }] = useRunPayrollCycleMutation();
  const [approvePayrollCycle, { isLoading: isApproving }] = useApprovePayrollCycleMutation();
  const [journalizePayrollCycle, { isLoading: isJournalizing }] =
    useJournalizePayrollCycleMutation();
  const [reopenPayrollCycle, { isLoading: isReopening }] = useReopenPayrollCycleMutation();
  const [reversePayrollCycle, { isLoading: isReversing }] = useReversePayrollCycleMutation();

  const rows = data?.data ?? [];

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Tabs defaultValue="cycles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cycles">Cycles</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
          </TabsList>

          <TabsContent value="cycles">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Payroll Cycles</CardTitle>
                <Button onClick={() => setIsCreateDialogOpen(true)}>Create cycle</Button>
              </CardHeader>
              <CardContent className="space-y-4">
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
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/payroll/inputs?cycleId=${row.id}`}>Inputs</Link>
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
            <PayrollPayslipsTab
              cycles={rows}
              selectedCycleId={selectedCycleId}
              onSelectCycle={setSelectedCycleId}
            />
          </TabsContent>
        </Tabs>
      </ScrollableWrapper>
      <CreatePayrollCycleDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <EntityAuditHistoryCard
        title="Payroll Run History"
        entityType="payroll_run"
        entityId={rows.find((row) => row.id === selectedCycleId)?.latestRunId ?? null}
      />
    </div>
  );
}
