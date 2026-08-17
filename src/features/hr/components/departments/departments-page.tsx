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
import { useListDepartmentsQuery } from '../../api/hr.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { AddDepartmentDialog } from './add-department-dialog';

export function DepartmentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, isLoading } = useListDepartmentsQuery();

  const rows = data?.data ?? [];

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Departments</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>Add department</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3}>Loading departments...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.code ?? '-'}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>No departments found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AddDepartmentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </ScrollableWrapper>
  );
}
