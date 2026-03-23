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
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useListBranchOptionsQuery } from '@/features/branches';
import {
  useCheckInAttendanceMutation,
  useCheckOutAttendanceMutation,
  useListAttendanceQuery,
  useListEmployeesQuery,
} from '../api/hr.api';

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatMinutes(minutes?: number | null) {
  const total = Number(minutes ?? 0);
  if (!total) return '-';
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return `${hours}h ${remainder}m`;
}

export function AttendancePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState(() => todayDateInputValue());
  const [to, setTo] = useState(() => todayDateInputValue());
  const selectedEmployeeId = employeeId && employeeId !== '__all__' ? employeeId : '';
  const selectedBranchId = branchId && branchId !== '__all__' ? branchId : '';

  const { data: employeesData } = useListEmployeesQuery({ pageSize: 100 });
  const { data: branchOptions = [] } = useListBranchOptionsQuery();
  const { data, isLoading } = useListAttendanceQuery({
    from,
    to,
    employeeId: selectedEmployeeId || null,
    branchId: selectedBranchId || null,
    pageSize: 100,
  });
  const [checkInAttendance, { isLoading: isCheckingIn }] = useCheckInAttendanceMutation();
  const [checkOutAttendance, { isLoading: isCheckingOut }] = useCheckOutAttendanceMutation();

  const employees = employeesData?.data ?? [];
  const rows = data?.data ?? [];

  return (
    <div className="w-full space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.displayName} ({employee.employeeNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All branches</SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <div className="flex gap-2">
              <Button
                disabled={!selectedEmployeeId || isCheckingIn}
                onClick={async () => {
                  const selectedEmployee = employees.find((item) => item.id === selectedEmployeeId);
                  await checkInAttendance({
                    employeeId: selectedEmployeeId,
                    branchId: selectedEmployee?.branchId ?? null,
                    locationId: selectedEmployee?.locationId ?? null,
                  }).unwrap();
                }}
              >
                Check in
              </Button>
              <Button
                variant="outline"
                disabled={!selectedEmployeeId || isCheckingOut}
                onClick={async () => {
                  await checkOutAttendance({ employeeId: selectedEmployeeId }).unwrap();
                }}
              >
                Check out
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
                <TableHead>Worked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>Loading attendance...</TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.attendanceDate.slice(0, 10)}</TableCell>
                    <TableCell>{row.employeeName ?? '-'}</TableCell>
                    <TableCell>{row.branchName ?? '-'}</TableCell>
                    <TableCell>{row.locationName ?? '-'}</TableCell>
                    <TableCell>
                      {row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell>
                      {row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell>{formatMinutes(row.minutesWorked)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>No attendance records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
