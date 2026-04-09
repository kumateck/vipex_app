import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useCreateFleetShiftRosterMutation,
  useListFleetDriverOptionsQuery,
  useListFleetVehicleOptionsQuery,
} from '../../api/fleet-transport.api';

export function FleetShiftRostersCreatePage() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [vehicleId, setVehicleId] = useState('__none__');
  const [roleType, setRoleType] = useState('0');
  const [shiftStartAt, setShiftStartAt] = useState('');
  const [shiftEndAt, setShiftEndAt] = useState('');
  const [note, setNote] = useState('');

  const { data: drivers = [] } = useListFleetDriverOptionsQuery();
  const { data: vehicles = [] } = useListFleetVehicleOptionsQuery({ isActive: true });
  const [createRoster, { isLoading: creating }] = useCreateFleetShiftRosterMutation();

  const onCreateRoster = async () => {
    if (!employeeId || !shiftStartAt || !shiftEndAt) {
      toast.error('Employee, shift start, and shift end are required');
      return;
    }
    try {
      await createRoster({
        employeeId,
        vehicleId: vehicleId === '__none__' ? null : vehicleId,
        roleType: Number(roleType),
        shiftStartAt: new Date(shiftStartAt).toISOString(),
        shiftEndAt: new Date(shiftEndAt).toISOString(),
        note: note.trim() || null,
      }).unwrap();
      toast.success('Shift roster created');
      navigate('/fleet-transport/rosters');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create shift roster');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Shift Roster</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/rosters">Back to list</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.employeeNumber} - {driver.displayName}
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
                    {vehicle.plateNumber} - {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleType} onValueChange={setRoleType}>
              <SelectTrigger>
                <SelectValue placeholder="Role type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Driver</SelectItem>
                <SelectItem value="1">Crew</SelectItem>
              </SelectContent>
            </Select>
            <DateTimePicker
              value={shiftStartAt ? new Date(shiftStartAt) : undefined}
              onChange={(value) => setShiftStartAt(value ? value.toISOString() : '')}
              placeholder="Shift start"
            />
            <DateTimePicker
              value={shiftEndAt ? new Date(shiftEndAt) : undefined}
              onChange={(value) => setShiftEndAt(value ? value.toISOString() : '')}
              placeholder="Shift end"
            />
            <Input
              placeholder="Note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={onCreateRoster} disabled={creating}>
                Create roster
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/rosters')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
