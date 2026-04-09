import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useCreateFleetComplianceIncidentMutation,
  useListFleetDriverOptionsQuery,
  useListFleetTripsQuery,
  useListFleetVehicleOptionsQuery,
} from '../../api/fleet-transport.api';

export function FleetComplianceIncidentCreatePage() {
  const navigate = useNavigate();
  const [incidentType, setIncidentType] = useState('0');
  const [severity, setSeverity] = useState('1');
  const [tripId, setTripId] = useState('__none__');
  const [vehicleId, setVehicleId] = useState('__none__');
  const [employeeId, setEmployeeId] = useState('__none__');
  const [occurredAt, setOccurredAt] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const { data: tripsRes } = useListFleetTripsQuery({ pageSize: 100 });
  const { data: vehicles = [] } = useListFleetVehicleOptionsQuery();
  const { data: drivers = [] } = useListFleetDriverOptionsQuery();
  const trips = useMemo(() => tripsRes?.data ?? [], [tripsRes?.data]);

  const [createIncident, { isLoading: saving }] = useCreateFleetComplianceIncidentMutation();

  const onCreate = async () => {
    if (!description.trim()) {
      toast.error('Incident description is required');
      return;
    }
    try {
      await createIncident({
        incidentType: Number(incidentType),
        severity: Number(severity),
        tripId: tripId === '__none__' ? null : tripId,
        vehicleId: vehicleId === '__none__' ? null : vehicleId,
        employeeId: employeeId === '__none__' ? null : employeeId,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
        locationLabel: location.trim() || null,
        description: description.trim(),
        actionTaken: actionTaken.trim() || null,
      }).unwrap();
      toast.success('Compliance incident created');
      navigate('/fleet-transport/compliance/ops');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create incident');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Record Compliance Incident</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/compliance/ops">Back</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger>
                <SelectValue placeholder="Incident type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Violation</SelectItem>
                <SelectItem value="1">Accident</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Low</SelectItem>
                <SelectItem value="1">Medium</SelectItem>
                <SelectItem value="2">High</SelectItem>
                <SelectItem value="3">Critical</SelectItem>
              </SelectContent>
            </Select>
            <DateTimePicker
              value={occurredAt ? new Date(occurredAt) : undefined}
              onChange={(value) => setOccurredAt(value ? value.toISOString() : '')}
            />
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger>
                <SelectValue placeholder="Trip (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No trip</SelectItem>
                {trips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.tripNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Vehicle (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No vehicle</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Driver/employee (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No employee</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.employeeNumber} - {driver.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
            <Input
              placeholder="Incident description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <Input
              placeholder="Action taken"
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                Record incident
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/compliance/ops')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
