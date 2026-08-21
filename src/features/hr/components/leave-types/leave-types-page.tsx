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
import { useListLeaveTypesQuery } from '../../api/hr.api';
import { AddLeaveTypeDialog } from './add-leave-type-dialog';

export function LeaveTypesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: leaveTypesData } = useListLeaveTypesQuery({ pageSize: 100 });
  const leaveTypes = leaveTypesData?.data ?? [];

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leave Types</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>Add leave type</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Min Advance (Days)</TableHead>
                  <TableHead>Emergency Same-day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.length ? (
                  leaveTypes.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.code ?? '-'}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.isPaid ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{Math.max(0, Number(row.minAdvanceDays ?? 0))}</TableCell>
                      <TableCell>{row.allowEmergencySameDay ? 'Allowed' : 'Blocked'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No leave types configured.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AddLeaveTypeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </ScrollableWrapper>
  );
}
