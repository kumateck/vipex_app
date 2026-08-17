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
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListJobTitlesQuery } from '../../api/hr.api';
import { AddJobTitleDialog } from './add-job-title-dialog';

export function JobTitlesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, isLoading } = useListJobTitlesQuery();

  const rows = data?.data ?? [];

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Job Titles</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>Add job title</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Default Leave Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading job titles...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.departmentName ?? '-'}</TableCell>
                      <TableCell>{row.code ?? '-'}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{Math.max(0, Number(row.defaultLeaveDays ?? 0))}</TableCell>
                      <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No job titles found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AddJobTitleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </ScrollableWrapper>
  );
}
