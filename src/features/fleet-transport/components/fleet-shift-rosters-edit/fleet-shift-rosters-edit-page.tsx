import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  useGetFleetShiftRosterQuery,
  useListFleetVehicleOptionsQuery,
  useUpdateFleetShiftRosterMutation,
} from '../../api/fleet-transport.api';

export function FleetShiftRostersEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetFleetShiftRosterQuery({ id }, { skip: !id });
  const { data: vehicles = [] } = useListFleetVehicleOptionsQuery();
  const [updateRoster, { isLoading: updating }] = useUpdateFleetShiftRosterMutation();

  const [vehicleId, setVehicleId] = useState('__none__');
  const [status, setStatus] = useState('0');
  const [shiftStartAt, setShiftStartAt] = useState('');
  const [shiftEndAt, setShiftEndAt] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!data) return;
    setVehicleId(data.vehicleId ?? '__none__');
    setStatus(String(data.status));
    setShiftStartAt(data.shiftStartAt.slice(0, 16));
    setShiftEndAt(data.shiftEndAt.slice(0, 16));
    setNote(data.note ?? '');
  }, [data]);

  const onSave = async () => {
    if (!id) return;
    try {
      await updateRoster({
        id,
        vehicleId: vehicleId === '__none__' ? null : vehicleId,
        status: Number(status),
        shiftStartAt: shiftStartAt ? new Date(shiftStartAt).toISOString() : null,
        shiftEndAt: shiftEndAt ? new Date(shiftEndAt).toISOString() : null,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Roster updated');
      navigate('/fleet-transport/rosters');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update roster');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Edit Shift Roster</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/rosters">Back to list</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading roster...</p> : null}
            {data ? (
              <>
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
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Planned</SelectItem>
                    <SelectItem value="1">Completed</SelectItem>
                    <SelectItem value="2">Cancelled</SelectItem>
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
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Note (optional)"
                />
                <div className="flex gap-2">
                  <Button onClick={onSave} disabled={updating}>
                    Save changes
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/fleet-transport/rosters')}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
