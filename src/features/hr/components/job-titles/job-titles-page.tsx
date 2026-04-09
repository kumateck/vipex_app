import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCreateJobTitleMutation,
  useListDepartmentOptionsQuery,
  useListJobTitlesQuery,
} from '../../api/hr.api';

export function JobTitlesPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [defaultLeaveDays, setDefaultLeaveDays] = useState('0');
  const { data, isLoading } = useListJobTitlesQuery();
  const { data: departmentOptions = [] } = useListDepartmentOptionsQuery();
  const [createJobTitle, { isLoading: isCreating }] = useCreateJobTitleMutation();

  const rows = data?.data ?? [];

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Job Titles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-5">
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Job title code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Input
                placeholder="Job title name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="number"
                min={0}
                placeholder="Default leave days"
                value={defaultLeaveDays}
                onChange={(e) => setDefaultLeaveDays(e.target.value)}
              />
              <Button
                disabled={!name.trim() || !departmentId || isCreating}
                onClick={async () => {
                  await createJobTitle({
                    departmentId,
                    code: code || null,
                    name: name.trim(),
                    defaultLeaveDays: Math.max(0, Number(defaultLeaveDays) || 0),
                  }).unwrap();
                  setDepartmentId('');
                  setCode('');
                  setName('');
                  setDefaultLeaveDays('0');
                }}
              >
                Add
              </Button>
            </div>
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
    </ScrollableWrapper>
  );
}
