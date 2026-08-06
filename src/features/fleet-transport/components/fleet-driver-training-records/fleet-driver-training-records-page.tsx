import { useMemo, useState } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Link } from 'react-router-dom';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useListFleetDriverComplianceRecordsQuery,
  useListFleetDriverOptionsQuery,
} from '../../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return sharedFormatDateTime(value);
}

export function FleetDriverTrainingRecordsPage() {
  const [employeeId, setEmployeeId] = useState('');
  const { data: drivers = [] } = useListFleetDriverOptionsQuery();
  const { data: records = [], isLoading } = useListFleetDriverComplianceRecordsQuery(
    { employeeId },
    { skip: !employeeId },
  );
  const trainingRecords = useMemo(
    () => records.filter((item) => item.complianceType === 1),
    [records],
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Driver Training Records</CardTitle>
            <Button asChild>
              <Link to="/fleet-transport/drivers/training/new">Add training record</Link>
            </Button>
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
              <p className="text-sm text-muted-foreground">Select a driver to view records.</p>
            ) : null}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading training records...</p>
            ) : null}
            {!isLoading && employeeId && trainingRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No training records found.</p>
            ) : null}
            {trainingRecords.map((record) => (
              <div key={record.id} className="rounded border p-3 text-sm">
                <p className="font-medium">Training</p>
                <p className="text-muted-foreground">
                  Document: {record.documentNumber ?? '-'} | Issuer: {record.issuer ?? '-'}
                </p>
                <p className="text-muted-foreground">
                  Issued: {formatDateTime(record.issuedAt)} | Expires:{' '}
                  {formatDateTime(record.expiresAt)}
                </p>
                {record.note ? <p className="text-muted-foreground">Note: {record.note}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
