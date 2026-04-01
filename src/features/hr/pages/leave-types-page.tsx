import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
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
import { useCreateLeaveTypeMutation, useListLeaveTypesQuery } from '../api/hr.api';

export function LeaveTypesPage() {
  const [leaveTypeCode, setLeaveTypeCode] = useState('');
  const [leaveTypeName, setLeaveTypeName] = useState('');
  const [leaveTypePaid, setLeaveTypePaid] = useState('true');
  const [minAdvanceDays, setMinAdvanceDays] = useState('0');
  const [allowEmergencySameDay, setAllowEmergencySameDay] = useState('true');

  const { data: leaveTypesData } = useListLeaveTypesQuery({ pageSize: 100 });
  const leaveTypes = leaveTypesData?.data ?? [];
  const [createLeaveType, { isLoading: isCreatingLeaveType }] = useCreateLeaveTypeMutation();

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Leave Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-6">
              <Input
                placeholder="Code"
                value={leaveTypeCode}
                onChange={(e) => setLeaveTypeCode(e.target.value)}
              />
              <Input
                placeholder="Name"
                value={leaveTypeName}
                onChange={(e) => setLeaveTypeName(e.target.value)}
              />
              <Select value={leaveTypePaid} onValueChange={setLeaveTypePaid}>
                <SelectTrigger>
                  <SelectValue placeholder="Paid?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Paid</SelectItem>
                  <SelectItem value="false">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0}
                placeholder="Min advance days"
                value={minAdvanceDays}
                onChange={(e) => setMinAdvanceDays(e.target.value)}
              />
              <Select value={allowEmergencySameDay} onValueChange={setAllowEmergencySameDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Same-day emergency?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Emergency same-day allowed</SelectItem>
                  <SelectItem value="false">Emergency same-day blocked</SelectItem>
                </SelectContent>
              </Select>
              <Button
                disabled={!leaveTypeName.trim() || isCreatingLeaveType}
                onClick={async () => {
                  await createLeaveType({
                    code: leaveTypeCode.trim() || null,
                    name: leaveTypeName.trim(),
                    isPaid: leaveTypePaid === 'true',
                    minAdvanceDays: Math.max(0, Number(minAdvanceDays) || 0),
                    allowEmergencySameDay: allowEmergencySameDay === 'true',
                  }).unwrap();
                  setLeaveTypeCode('');
                  setLeaveTypeName('');
                  setLeaveTypePaid('true');
                  setMinAdvanceDays('0');
                  setAllowEmergencySameDay('true');
                }}
              >
                Add type
              </Button>
            </div>

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
    </ScrollableWrapper>
  );
}
