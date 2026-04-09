import { useState } from 'react';
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
  useListFleetComplianceIncidentsQuery,
  useListFleetDriverOptionsQuery,
} from '../api/fleet-transport.api';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function FleetDriverIncidentHistoryPage() {
  const [employeeId, setEmployeeId] = useState('');
  const { data: drivers = [] } = useListFleetDriverOptionsQuery();
  const { data: incidents, isLoading } = useListFleetComplianceIncidentsQuery(
    { pageSize: 50, filters: { employeeId } },
    { skip: !employeeId },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Driver Incident History</CardTitle>
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
              <p className="text-sm text-muted-foreground">Select a driver to view incidents.</p>
            ) : null}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading incidents...</p>
            ) : null}
            {!isLoading && employeeId && (incidents?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents found for this driver.</p>
            ) : null}
            {incidents?.data.map((incident) => (
              <div key={incident.id} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  {incident.incidentType === 0 ? 'Violation' : 'Accident'} • Severity{' '}
                  {incident.severity}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(incident.occurredAt)} • {incident.locationLabel ?? '-'}
                </p>
                <p>{incident.description}</p>
                {incident.actionTaken ? (
                  <p className="text-muted-foreground">Action: {incident.actionTaken}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
