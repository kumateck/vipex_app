import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useListCompensationQuery,
  useListDeductionTypesQuery,
  useListEarningTypesQuery,
} from '../../api/payroll.api';
import { DeductionTypeDialog } from './deduction-type-dialog';
import { EarningTypeDialog } from './earning-type-dialog';
import { EmployeeCompensationDialog } from './employee-compensation-dialog';

export function PayrollCompensationPage() {
  const [earningDialogOpen, setEarningDialogOpen] = useState(false);
  const [deductionDialogOpen, setDeductionDialogOpen] = useState(false);
  const [compensationDialogOpen, setCompensationDialogOpen] = useState(false);
  const { data: earningTypesData } = useListEarningTypesQuery({ pageSize: 100 });
  const { data: deductionTypesData } = useListDeductionTypesQuery({ pageSize: 100 });
  const { data: compensationData } = useListCompensationQuery({ pageSize: 100 });
  const earningTypes = earningTypesData?.data ?? [];
  const deductionTypes = deductionTypesData?.data ?? [];
  const compensationRows = compensationData?.data ?? [];

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Tabs defaultValue="types" className="space-y-4">
          <TabsList>
            <TabsTrigger value="types">Earnings & deductions</TabsTrigger>
            <TabsTrigger value="employee">Employee compensation</TabsTrigger>
          </TabsList>

          <TabsContent value="types">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Earning types</CardTitle>
                  <Button size="sm" onClick={() => setEarningDialogOpen(true)}>
                    Add earning type
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead>Taxable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earningTypes.length ? (
                        earningTypes.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.code}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.isRecurring ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{row.isTaxable ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4}>No earning types configured.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Deduction types</CardTitle>
                  <Button size="sm" onClick={() => setDeductionDialogOpen(true)}>
                    Add deduction type
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead>Statutory</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deductionTypes.length ? (
                        deductionTypes.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.code}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.isRecurring ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{row.isStatutory ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4}>No deduction types configured.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employee">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current assignments</CardTitle>
                <Button size="sm" onClick={() => setCompensationDialogOpen(true)}>
                  Assign compensation
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Base pay</TableHead>
                      <TableHead>Effective</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compensationRows.length ? (
                      compensationRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.employeeName}</TableCell>
                          <TableCell>{row.payrollGroupName ?? '-'}</TableCell>
                          <TableCell>
                            {row.basePayPsw} {row.currencyCode}
                          </TableCell>
                          <TableCell>{row.effectiveFrom?.slice(0, 10) ?? '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4}>No employee compensation configured.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollableWrapper>

      <EarningTypeDialog open={earningDialogOpen} onOpenChange={setEarningDialogOpen} />
      <DeductionTypeDialog open={deductionDialogOpen} onOpenChange={setDeductionDialogOpen} />
      <EmployeeCompensationDialog
        open={compensationDialogOpen}
        onOpenChange={setCompensationDialogOpen}
      />
    </div>
  );
}
