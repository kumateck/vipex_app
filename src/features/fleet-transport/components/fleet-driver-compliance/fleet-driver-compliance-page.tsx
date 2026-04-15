import { useMemo, useState } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { Link } from 'react-router-dom';
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
} from '@/components/ui/select-searchable';
import {
  useListFleetComplianceIncidentsQuery,
  useListFleetDriverComplianceAlertsQuery,
  useListFleetDriverComplianceRecordsQuery,
  useListFleetDriverOptionsQuery,
  useListFleetShiftRostersQuery,
} from '../../api/fleet-transport.api';

function complianceTypeLabel(value: number) {
  if (value === 0) return 'License';
  if (value === 1) return 'Training';
  if (value === 2) return 'Medical';
  if (value === 3) return 'Background Check';
  if (value === 4) return 'Other';
  return 'Unknown';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return sharedFormatDateTime(value);
}

export function FleetDriverCompliancePage() {
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [alertHorizonDays, setAlertHorizonDays] = useState('30');

  const { data: driverOptions = [] } = useListFleetDriverOptionsQuery();
  const { data: records = [], isLoading: loadingRecords } =
    useListFleetDriverComplianceRecordsQuery(
      { employeeId: selectedDriverId },
      { skip: !selectedDriverId },
    );
  const { data: alerts, isLoading: loadingAlerts } = useListFleetDriverComplianceAlertsQuery({
    horizonDays: alertHorizonDays.trim() ? Number(alertHorizonDays) : 30,
    limit: 100,
  });
  const { data: incidentHistory, isLoading: loadingIncidents } =
    useListFleetComplianceIncidentsQuery(
      { pageSize: 20, filters: { employeeId: selectedDriverId } },
      { skip: !selectedDriverId },
    );
  const { data: rosterHistory, isLoading: loadingRosters } = useListFleetShiftRostersQuery(
    { pageSize: 20, filters: { employeeId: selectedDriverId } },
    { skip: !selectedDriverId },
  );

  const selectedDriver = useMemo(
    () => driverOptions.find((item) => item.id === selectedDriverId) ?? null,
    [driverOptions, selectedDriverId],
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Driver Compliance</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/drivers/training">Training Records</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/drivers/incidents/history">Incident History</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/drivers/rosters/history">Roster History</Link>
              </Button>
              <Button asChild>
                <Link to="/fleet-transport/drivers/compliance/new">Add Compliance Record</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={alertHorizonDays}
                onChange={(event) => setAlertHorizonDays(event.target.value)}
                placeholder="Alerts horizon days"
              />
            </div>
            {loadingAlerts ? (
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            ) : null}
            <p className="text-sm">
              Alerts ({alertHorizonDays || '30'} days) - Total: {alerts?.summary.total ?? 0} |
              Expired: {alerts?.summary.expired ?? 0} | Due soon: {alerts?.summary.dueSoon ?? 0}
            </p>
            {(alerts?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No driver compliance alerts.</p>
            ) : (
              <div className="space-y-2">
                {alerts?.data.slice(0, 8).map((alert) => (
                  <div key={alert.id} className="rounded border p-2 text-sm">
                    <span className="font-medium">
                      {alert.employeeNumber} - {alert.employeeName}
                    </span>{' '}
                    - {alert.label} (
                    {alert.severity === 'expired'
                      ? 'Expired'
                      : `Due in ${alert.daysUntilDue} day(s)`}
                    )
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {driverOptions.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.employeeNumber} - {driver.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedDriver ? (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedDriver.employeeNumber} - {selectedDriver.displayName} (
                {selectedDriver.jobTitleName ?? 'Driver'})
              </p>
            ) : null}

            <div className="rounded border p-3 space-y-2">
              <p className="font-medium">Compliance History</p>
              {!selectedDriverId ? (
                <p className="text-sm text-muted-foreground">Select a driver to view records.</p>
              ) : null}
              {loadingRecords ? (
                <p className="text-sm text-muted-foreground">Loading records...</p>
              ) : null}
              {!loadingRecords && selectedDriverId && records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No compliance records found.</p>
              ) : null}
              {records.map((record) => (
                <div key={record.id} className="rounded border p-2 text-sm">
                  <p className="font-medium">{complianceTypeLabel(record.complianceType)}</p>
                  <p className="text-muted-foreground">
                    Document: {record.documentNumber ?? '-'} | Issuer: {record.issuer ?? '-'}
                  </p>
                  <p className="text-muted-foreground">
                    Issued: {formatDateTime(record.issuedAt)} | Expires:{' '}
                    {formatDateTime(record.expiresAt)}
                  </p>
                  {record.note ? <p>{record.note}</p> : null}
                </div>
              ))}
            </div>

            <div className="rounded border p-3 space-y-2">
              <p className="font-medium">Incident History</p>
              {!selectedDriverId ? (
                <p className="text-sm text-muted-foreground">Select a driver to view incidents.</p>
              ) : null}
              {loadingIncidents ? (
                <p className="text-sm text-muted-foreground">Loading incidents...</p>
              ) : null}
              {!loadingIncidents &&
              selectedDriverId &&
              (incidentHistory?.data.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No incidents found for this driver.</p>
              ) : null}
              {incidentHistory?.data.map((incident) => (
                <div key={incident.id} className="rounded border p-2 text-sm">
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
            </div>

            <div className="rounded border p-3 space-y-2">
              <p className="font-medium">Shift Roster Timeline</p>
              {!selectedDriverId ? (
                <p className="text-sm text-muted-foreground">Select a driver to view rosters.</p>
              ) : null}
              {loadingRosters ? (
                <p className="text-sm text-muted-foreground">Loading rosters...</p>
              ) : null}
              {!loadingRosters && selectedDriverId && (rosterHistory?.data.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No roster records for this driver.</p>
              ) : null}
              {rosterHistory?.data.map((roster) => (
                <div key={roster.id} className="rounded border p-2 text-sm">
                  <p className="font-medium">
                    {roster.roleType === 0 ? 'Driver' : 'Crew'} •{' '}
                    {roster.status === 0
                      ? 'Planned'
                      : roster.status === 1
                        ? 'Completed'
                        : 'Cancelled'}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDateTime(roster.shiftStartAt)} - {formatDateTime(roster.shiftEndAt)}
                  </p>
                  <p className="text-muted-foreground">
                    Vehicle: {roster.vehiclePlateNumber ?? roster.vehicleId ?? '-'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
