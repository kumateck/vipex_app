import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmploymentStatus } from '@/db/schemas/enums';
import { useListEmployeeOptionsQuery } from '@/features/hr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useCreateFleetTripMutation,
  useListFleetRoutePlansQuery,
  useListFleetVehicleOptionsQuery,
} from '../../api/fleet-transport.api';

function toIsoOrNull(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function FleetTripsCreatePage() {
  const navigate = useNavigate();
  const [vehicleId, setVehicleId] = useState('__none__');
  const [routePlanId, setRoutePlanId] = useState('__none__');
  const [driverEmployeeId, setDriverEmployeeId] = useState('__none__');
  const [plannedStartAt, setPlannedStartAt] = useState('');
  const [plannedEndAt, setPlannedEndAt] = useState('');
  const [note, setNote] = useState('');

  const { data: vehicleOptions = [] } = useListFleetVehicleOptionsQuery({ isActive: true });
  const { data: routePlans = [] } = useListFleetRoutePlansQuery({ isActive: true });
  const { data: employeeOptions = [] } = useListEmployeeOptionsQuery({
    status: EmploymentStatus.ACTIVE,
  });

  const activeEmployees = useMemo(
    () => employeeOptions.filter((item) => item.employmentStatus === EmploymentStatus.ACTIVE),
    [employeeOptions],
  );

  const [createTrip, { isLoading }] = useCreateFleetTripMutation();

  const onSubmit = async () => {
    if (vehicleId === '__none__') {
      toast.error('Vehicle is required');
      return;
    }
    if (driverEmployeeId === '__none__') {
      toast.error('Driver is required');
      return;
    }

    const startAtIso = toIsoOrNull(plannedStartAt);
    const endAtIso = toIsoOrNull(plannedEndAt);

    if (plannedStartAt && !startAtIso) {
      toast.error('Planned start is invalid');
      return;
    }
    if (plannedEndAt && !endAtIso) {
      toast.error('Planned end is invalid');
      return;
    }
    if (startAtIso && endAtIso && new Date(endAtIso) < new Date(startAtIso)) {
      toast.error('Planned end cannot be earlier than planned start');
      return;
    }

    try {
      await createTrip({
        vehicleId,
        routePlanId: routePlanId === '__none__' ? null : routePlanId,
        driverEmployeeId,
        plannedStartAt: startAtIso,
        plannedEndAt: endAtIso,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Trip created');
      navigate('/fleet-transport/trips');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create trip');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Vehicle</FieldLabel>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select vehicle</SelectItem>
                    {vehicleOptions.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Driver (Employee)</FieldLabel>
                <Select value={driverEmployeeId} onValueChange={setDriverEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select driver</SelectItem>
                    {activeEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.employeeNumber} - {employee.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Route Plan (Optional)</FieldLabel>
                <Select value={routePlanId} onValueChange={setRoutePlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No route plan</SelectItem>
                    {routePlans.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Planned Start</FieldLabel>
                <DateTimePicker
                  value={plannedStartAt ? new Date(plannedStartAt) : undefined}
                  onChange={(value) => setPlannedStartAt(value ? value.toISOString() : '')}
                />
              </Field>
              <Field>
                <FieldLabel>Planned End</FieldLabel>
                <DateTimePicker
                  value={plannedEndAt ? new Date(plannedEndAt) : undefined}
                  onChange={(value) => setPlannedEndAt(value ? value.toISOString() : '')}
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Note</FieldLabel>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Save trip
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/trips')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
