import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useListPayrollGroupsQuery } from '../../api/payroll.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { AddPayrollGroupDialog } from './add-payroll-group-dialog';

export function PayrollGroupsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, isLoading } = useListPayrollGroupsQuery();

  const rows = data?.data ?? [];

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payroll Groups</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>Add payroll group</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>Loading payroll groups...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.payFrequency === 0 ? 'Monthly' : row.payFrequency}</TableCell>
                      <TableCell>{row.currencyCode}</TableCell>
                      <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No payroll groups found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AddPayrollGroupDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </ScrollableWrapper>
  );
}
