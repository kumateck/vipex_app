import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCreatePayrollGroupMutation, useListPayrollGroupsQuery } from '../api/payroll.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function PayrollGroupsPage() {
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('GHS');
  const { data, isLoading } = useListPayrollGroupsQuery();
  const [createPayrollGroup, { isLoading: isCreating }] = useCreatePayrollGroupMutation();

  const rows = data?.data ?? [];

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Payroll Groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Payroll group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Currency"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
              />
              <Button
                disabled={!name.trim() || isCreating}
                onClick={async () => {
                  await createPayrollGroup({
                    name: name.trim(),
                    payFrequency: 0,
                    currencyCode: currencyCode.trim() || 'GHS',
                  }).unwrap();
                  setName('');
                }}
              >
                Add
              </Button>
            </div>
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
    </ScrollableWrapper>
  );
}
