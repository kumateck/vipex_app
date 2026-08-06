import { useState } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useListFleetDriverOptionsQuery,
  useListFleetShiftRostersQuery,
} from '../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return sharedFormatDateTime(value);
}

export function FleetDriverRosterHistoryPage() {
  const [employeeId, setEmployeeId] = useState('');
  const { data: drivers = [] } = useListFleetDriverOptionsQuery();
  const { data: rosters, isLoading } = useListFleetShiftRostersQuery(
    { pageSize: 50, filters: { employeeId } },
    { skip: !employeeId },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Driver Shift Roster History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.employeeNumber} - {driver.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!employeeId ? (
              <p className="text-sm text-muted-foreground">Select a driver to view rosters.</p>
            ) : null}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading roster history...</p>
            ) : null}
            {!isLoading && employeeId && (rosters?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No roster records found for this driver.
              </p>
            ) : null}
            {rosters?.data.map((row) => (
              <div key={row.id} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {row.roleType === 0 ? 'Driver' : 'Crew'} •{' '}
                  {row.status === 0 ? 'Planned' : row.status === 1 ? 'Completed' : 'Cancelled'}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(row.shiftStartAt)} - {formatDateTime(row.shiftEndAt)}
                </p>
                <p className="text-muted-foreground">
                  Vehicle: {row.vehiclePlateNumber ?? row.vehicleId ?? '-'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
